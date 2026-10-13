<?php

namespace App\Http\Controllers\Api\Student;

use App\Enums\EnrollmentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\StudentRules;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Services\ApplicationService;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function __construct(private ApplicationService $applications)
    {
    }

    public function show(Request $request): JsonResponse
    {
        $student = $this->ownStudent($request);

        return response()->json([
            'student' => $student ? StudentResource::make($student) : null,
            'edit_mode' => $this->editMode($student),
        ]);
    }

    /** Submit student information for the first time. Creates the record and a pending application. */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_if($user->student()->withTrashed()->exists(), 409, 'You have already submitted your student information.');

        $data = $request->validate(StudentRules::full(), StudentRules::messages());

        $student = DB::transaction(function () use ($data, $request, $user) {
            $student = new Student(collect($data)->except('photo')->all());
            $student->user_id = $user->id;
            $student->created_by = $user->id;
            $student->enrollment_status = EnrollmentStatus::Enrolled; // students cannot choose this
            if ($request->hasFile('photo')) {
                $student->photo_path = $this->storePhoto($request);
            }
            $student->save();

            AuditLogger::record('student.profile_submitted', $student, metadata: ['student_number' => $student->student_number]);
            $this->applications->submit($student);

            return $student;
        });

        return response()->json([
            'message' => 'Your information was submitted and is waiting for staff review.',
            'student' => StudentResource::make($this->load($student)),
            'edit_mode' => $this->editMode($student),
        ], 201);
    }

    /** Update. Approved students may only change contact details; everything else needs a correction request. */
    public function update(Request $request): JsonResponse
    {
        $student = $this->ownStudent($request);
        abort_unless($student, 404, 'Submit your student information first.');

        $mode = $this->editMode($student);
        abort_if($mode === 'locked', 403, 'Your record is archived. Please contact the registrar.');

        if ($mode === 'contact_only') {
            $this->rejectProtectedChanges($request, $student);
            $data = $request->validate(StudentRules::limited(), StudentRules::messages());
        } else {
            $data = $request->validate(StudentRules::full($student->id), StudentRules::messages());
        }

        $resubmit = in_array($student->portalStatus(), ['rejected', 'revoked'], true);

        DB::transaction(function () use ($student, $data, $request, $resubmit) {
            $before = $student->only(array_keys(collect($data)->except('photo')->all()));

            $student->fill(collect($data)->except('photo')->all());

            if ($request->hasFile('photo')) {
                $old = $student->photo_path;
                $student->photo_path = $this->storePhoto($request);
                if ($old) {
                    Storage::disk(config('digitalid.photo.disk'))->delete($old);
                }
            }

            $changed = array_keys(array_filter(
                $student->getDirty(),
                fn ($v, $k) => $k !== 'updated_at',
                ARRAY_FILTER_USE_BOTH
            ));
            $student->save();

            AuditLogger::record('student.profile_updated', $student, metadata: ['changed_fields' => $changed]);

            if ($resubmit) {
                $this->applications->submit($student);
            }
        });

        return response()->json([
            'message' => $resubmit
                ? 'Your corrected information was resubmitted for review.'
                : 'Your information was saved.',
            'student' => StudentResource::make($this->load($student)),
            'edit_mode' => $this->editMode($student->fresh()),
        ]);
    }

    /** full | contact_only | locked */
    private function editMode(?Student $student): string
    {
        if (! $student) {
            return 'full';
        }
        if ($student->trashed()) {
            return 'locked';
        }

        return in_array($student->portalStatus(), ['approved', 'suspended'], true) ? 'contact_only' : 'full';
    }

    private function rejectProtectedChanges(Request $request, Student $student): void
    {
        $errors = [];
        foreach (Student::PROTECTED_FIELDS as $field) {
            if ($field === 'photo') {
                if ($request->hasFile('photo')) {
                    $errors['photo'] = 'Your photo can no longer be changed here. Submit a correction request.';
                }
                continue;
            }
            if ($request->has($field) && (string) $request->input($field) !== (string) $student->{$field}) {
                $errors[$field] = 'This field is verified by the registrar. Submit a correction request to change it.';
            }
        }
        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function storePhoto(Request $request): string
    {
        return $request->file('photo')->store(
            config('digitalid.photo.directory'),
            config('digitalid.photo.disk')
        );
    }

    private function ownStudent(Request $request): ?Student
    {
        // Always resolved from the authenticated user, never from a client-supplied id.
        return $request->user()->student()->withTrashed()->with(['latestApplication', 'digitalId'])->first();
    }

    private function load(Student $student): Student
    {
        return $student->fresh(['latestApplication', 'digitalId']);
    }
}
