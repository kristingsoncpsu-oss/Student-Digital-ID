<?php

namespace App\Services;

use App\Enums\ApplicationStatus;
use App\Models\EnrollmentRecord;
use App\Models\Student;
use App\Models\StudentIdApplication;
use App\Models\User;
use App\Notifications\ApplicationReviewed;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ApplicationService
{
    public function __construct(
        private DigitalIdService $digitalIds,
        private SettingsService $settings,
    ) {
    }

    /** Open a new pending application for the student (idempotent while one is pending). */
    public function submit(Student $student): StudentIdApplication
    {
        return DB::transaction(function () use ($student) {
            // Serialise concurrent submissions for the same student.
            Student::query()->whereKey($student->id)->lockForUpdate()->first();

            $pending = StudentIdApplication::query()
                ->where('student_id', $student->id)
                ->where('status', ApplicationStatus::Pending)
                ->first();

            if ($pending) {
                return $pending;
            }

            $application = StudentIdApplication::create([
                'student_id' => $student->id,
                'status' => ApplicationStatus::Pending,
                'submitted_at' => now(),
            ]);

            AuditLogger::record('application.submitted', $application, metadata: ['student_id' => $student->id]);

            return $application;
        });
    }

    /**
     * Compare the submitted record to the authoritative enrollment registry.
     *
     * @return array{status: string, message: string, registry: ?array}
     */
    public function registryCheck(Student $student): array
    {
        $record = EnrollmentRecord::query()->where('student_number', $student->student_number)->first();

        if (! $record) {
            return ['status' => 'not_found', 'message' => 'This student number is not in the enrollment registry.', 'registry' => null];
        }

        $matches = strcasecmp($record->last_name, $student->last_name) === 0
            && strcasecmp($record->first_name, $student->first_name) === 0;

        return [
            'status' => $matches ? 'matched' : 'mismatch',
            'message' => $matches
                ? 'Name and student number match the enrollment registry.'
                : 'The student number exists but the registered name differs from the submission.',
            'registry' => [
                'first_name' => $record->first_name,
                'last_name' => $record->last_name,
                'program' => $record->program,
                'year_level' => $record->year_level,
            ],
        ];
    }

    public function approve(StudentIdApplication $application, User $reviewer, ?string $notes = null): StudentIdApplication
    {
        $result = DB::transaction(function () use ($application, $reviewer, $notes) {
            $locked = $this->lockPending($application);
            $student = $locked->student;

            abort_if($student->trashed(), 409, 'This student record is archived.');

            if ($this->settings->get('require_registry_match')
                && $this->registryCheck($student)['status'] !== 'matched') {
                throw ValidationException::withMessages([
                    'registry' => 'Approval requires a matching enrollment registry record, and none was found.',
                ]);
            }

            $locked->forceFill([
                'status' => ApplicationStatus::Approved,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'review_notes' => $notes,
                'rejection_reason' => null,
            ])->save();

            $digitalId = $this->digitalIds->issue($student, $reviewer);

            AuditLogger::record('application.approved', $locked, metadata: [
                'student_id' => $student->id,
                'digital_id_id' => $digitalId->id,
            ], actor: $reviewer);
            AuditLogger::record('digital_id.issued', $digitalId, metadata: ['student_id' => $student->id], actor: $reviewer);

            return $locked->load('student');
        });

        $this->notify($result, 'approved');

        return $result;
    }

    public function reject(StudentIdApplication $application, User $reviewer, string $reason, ?string $notes = null): StudentIdApplication
    {
        $result = DB::transaction(function () use ($application, $reviewer, $reason, $notes) {
            $locked = $this->lockPending($application);

            $locked->forceFill([
                'status' => ApplicationStatus::Rejected,
                'reviewed_by' => $reviewer->id,
                'reviewed_at' => now(),
                'review_notes' => $notes,
                'rejection_reason' => $reason,
            ])->save();

            AuditLogger::record('application.rejected', $locked, metadata: [
                'student_id' => $locked->student_id,
            ], actor: $reviewer);

            return $locked->load('student');
        });

        $this->notify($result, 'rejected');

        return $result;
    }

    /** Re-read the row under lock so a double-click or second reviewer cannot re-process it. */
    private function lockPending(StudentIdApplication $application): StudentIdApplication
    {
        $locked = StudentIdApplication::query()->with('student')->lockForUpdate()->findOrFail($application->id);

        abort_unless(
            $locked->status === ApplicationStatus::Pending,
            409,
            'This application has already been reviewed.'
        );

        return $locked;
    }

    /** Notification-ready: stored in the database; mail goes through whatever MAIL_MAILER is configured. */
    private function notify(StudentIdApplication $application, string $outcome): void
    {
        $user = $application->student?->user;
        if (! $user) {
            return;
        }

        try {
            $user->notify(new ApplicationReviewed($application, $outcome));
        } catch (\Throwable $e) {
            // A mail transport problem must never undo or block the review decision.
            Log::warning('Could not send application notification: '.$e->getMessage());
        }
    }
}
