<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\ApplicationStatus;
use App\Enums\DigitalIdStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\AuditLogResource;
use App\Http\Resources\StudentResource;
use App\Models\AuditLog;
use App\Models\DigitalId;
use App\Models\Student;
use App\Models\StudentIdApplication;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $this->authorize('viewAny', Student::class);

        // The most recent application per student is that student's "current" application.
        $currentApplications = StudentIdApplication::query()
            ->whereIn('id', fn ($q) => $q->selectRaw('MAX(id)')->from('student_id_applications')->groupBy('student_id'));

        $pending = (clone $currentApplications)->where('status', ApplicationStatus::Pending)->count();
        $rejected = (clone $currentApplications)->where('status', ApplicationStatus::Rejected)
            ->whereNotIn('student_id', DigitalId::query()->select('student_id'))->count();

        $approved = DigitalId::where('status', DigitalIdStatus::Active)->count();
        $suspended = DigitalId::where('status', DigitalIdStatus::Suspended)->count();
        $revoked = DigitalId::where('status', DigitalIdStatus::Revoked)->count();

        $studentAccounts = User::where('role', Role::Student)->count();
        $withRecords = Student::whereNotNull('user_id')->count();

        $oldest = (clone $currentApplications)->where('status', ApplicationStatus::Pending)->min('submitted_at');

        return response()->json([
            'totals' => [
                'registered_users' => $studentAccounts,
                'student_records' => Student::count(),
                'archived_records' => Student::onlyTrashed()->count(),
                'pending' => $pending,
                'approved' => $approved,
                'rejected' => $rejected,
                'suspended' => $suspended,
                'revoked' => $revoked,
                'pending_corrections' => DB::table('correction_requests')->where('status', 'pending')->count(),
                'oldest_pending_at' => $oldest ? \Illuminate\Support\Carbon::parse($oldest)->toIso8601String() : null,
            ],
            'status_distribution' => [
                ['key' => 'incomplete', 'label' => 'Not submitted', 'value' => max($studentAccounts - $withRecords, 0)],
                ['key' => 'pending', 'label' => 'Pending review', 'value' => $pending],
                ['key' => 'approved', 'label' => 'Approved', 'value' => $approved],
                ['key' => 'rejected', 'label' => 'Rejected', 'value' => $rejected],
                ['key' => 'suspended', 'label' => 'Suspended / revoked', 'value' => $suspended + $revoked],
            ],
            'registrations' => $this->registrationTrend(),
            'by_program' => Student::query()
                ->select('program', DB::raw('count(*) as total'))
                ->groupBy('program')->orderByDesc('total')->limit(8)->get()
                ->map(fn ($r) => ['program' => $r->program, 'total' => (int) $r->total]),
            'recent_registrations' => StudentResource::collection(
                Student::query()->with(['latestApplication', 'digitalId'])->latest()->limit(6)->get()
            ),
            'recent_activity' => AuditLogResource::collection(
                AuditLog::query()->with('actor')
                    ->whereIn('target_type', ['application', 'digital_id', 'student', 'correction_request'])
                    ->latest('id')->limit(8)->get()
            ),
        ]);
    }

    /** New student accounts per day for the last 30 days (zero-filled). */
    private function registrationTrend(): array
    {
        $start = now()->subDays(29)->startOfDay();

        $counts = User::query()
            ->where('role', Role::Student)
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->groupBy(fn ($u) => $u->created_at->format('Y-m-d'))
            ->map->count();

        return collect(range(0, 29))->map(function ($i) use ($start, $counts) {
            $day = $start->copy()->addDays($i);

            return ['date' => $day->format('Y-m-d'), 'count' => (int) ($counts[$day->format('Y-m-d')] ?? 0)];
        })->all();
    }
}
