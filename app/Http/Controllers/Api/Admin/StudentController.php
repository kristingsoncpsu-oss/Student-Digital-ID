<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\EnrollmentStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\StudentRules;
use App\Http\Resources\ApplicationResource;
use App\Http\Resources\CorrectionRequestResource;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Models\User;
use App\Services\ApplicationService;
use App\Services\AuditLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    private const SORTABLE = ['student_number', 'last_name', 'program', 'year_level', 'created_at'];

    public function __construct(private ApplicationService $applications)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', Student::class);

        $request->validate([
            'year_level' => ['nullable', 'integer', 'between:1,6'],
            'enrollment_status' => ['nullable', Rule::enum(EnrollmentStatus::class)],
            'id_status' => ['nullable', Rule::in(['pending', 'approved', 'rejected', 'suspended', 'revoked'])],
            'archived' => ['nullable', Rule::in(['only', 'with'])],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ]);

        $sort = in_array($request->query('sort'), self::SORTABLE, true) ? $request->query('sort') : 'created_at';
        $dir = $request->query('dir') === 'asc' ? 'asc' : 'desc';

        $query = Student::query()
            ->with(['latestApplication', 'digitalId'])
            ->search($request->query('search'))
            ->when($request->filled('program'), fn (Builder $q) => $q->where('program', $request->query('program')))
            ->when($request->filled('year_level'), fn (Builder $q) => $q->where('year_level', $request->integer('year_level')))
            ->when($request->filled('enrollment_status'), fn (Builder $q) => $q->where('enrollment_status', $request->query('enrollment_status')))
            ->when($request->filled('id_status'), fn (Builder $q) => $this->filterIdStatus($q, $request->query('id_status')))
            ->when($request->query('archived') === 'only', fn (Builder $q) => $q->onlyTrashed())
            ->when($request->query('archived') === 'with', fn (Builder $q) => $q->withTrashed())
            ->orderBy($sort, $dir)
            ->orderBy('id', 'desc');

        return StudentResource::collection($query->paginate($request->integer('per_page', 15))->withQueryString());
    }

    public function show(int $id): JsonResponse
    {
        $student = Student::withTrashed()->with(['user', 'digitalId', 'latestApplication', 'creator'])->findOrFail($id);
        $this->authorize('view', $student);

        return response()->json([
            'student' => StudentResource::make($student),
            'applications' => ApplicationResource::collection($student->applications()->with('reviewer')->latest('id')->get()),
            'corrections' => CorrectionRequestResource::collection($student->correctionRequests()->with('reviewer')->latest('id')->get()),
            'registry_check' => $this->applications->registryCheck($student),
            'created_by' => $student->creator?->name,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Student::class);

        $rules = StudentRules::full();
        $rules['create_account'] = ['sometimes', 'boolean'];
        $data = $request->validate($rules, StudentRules::messages());

        $student = DB::transaction(function () use ($data, $request) {
            $student = new Student(collect($data)->except(['photo', 'create_account'])->all());
            $student->enrollment_status = EnrollmentStatus::Enrolled;
            $student->created_by = $request->user()->id;

            if ($request->hasFile('photo')) {
                $student->photo_path = $request->file('photo')->store(
                    config('digitalid.photo.directory'),
                    config('digitalid.photo.disk')
                );
            }

            if ($request->boolean('create_account', true)) {
                $request->validate(['school_email' => [Rule::unique('users', 'email')]], [
                    'school_email.unique' => 'An account with this email already exists.',
                ]);

                $user = new User([
                    'name' => $student->full_name,
                    'email' => strtolower($data['school_email']),
                    'password' => Str::random(40), // unusable until the student sets one via the reset link
                ]);
                $user->role = Role::Student;
                $user->is_active = true;
                $user->save();
                $student->user_id = $user->id;
            }

            $student->save();

            AuditLogger::record('student.created', $student, metadata: ['student_number' => $student->student_number]);
            $this->applications->submit($student);

            return $student;
        });

        if ($student->user) {
            // The student receives a link to set their own password (delivered by the configured mailer).
            Password::sendResetLink(['email' => $student->user->email]);
        }

        return response()->json([
            'message' => 'Student record created and queued for review.',
            'student' => StudentResource::make($student->fresh(['latestApplication', 'digitalId', 'user'])),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $student = Student::withTrashed()->findOrFail($id);
        $this->authorize('update', $student);

        $rules = StudentRules::full($student->id);
        $rules['enrollment_status'] = ['required', Rule::enum(EnrollmentStatus::class)];
        $data = $request->validate($rules, StudentRules::messages());

        DB::transaction(function () use ($student, $data, $request) {
            $student->fill(collect($data)->except(['photo', 'enrollment_status'])->all());
            $student->enrollment_status = EnrollmentStatus::from($data['enrollment_status']);

            if ($request->hasFile('photo')) {
                $old = $student->photo_path;
                $student->photo_path = $request->file('photo')->store(
                    config('digitalid.photo.directory'),
                    config('digitalid.photo.disk')
                );
                if ($old) {
                    Storage::disk(config('digitalid.photo.disk'))->delete($old);
                }
            }

            $changed = array_values(array_diff(array_keys($student->getDirty()), ['updated_at']));
            $student->save();

            AuditLogger::record('student.updated', $student, metadata: ['changed_fields' => $changed]);
        });

        return response()->json([
            'message' => 'Student record updated.',
            'student' => StudentResource::make($student->fresh(['latestApplication', 'digitalId', 'user'])),
        ]);
    }

    /** Archive (soft delete). The record, its history and audit trail are preserved. */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $this->authorize('delete', $student);

        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        DB::transaction(function () use ($student, $data) {
            $student->delete();
            AuditLogger::record('student.archived', $student, metadata: [
                'student_number' => $student->student_number,
                'reason' => $data['reason'] ?? null,
            ]);
        });

        return response()->json(['message' => 'Student record archived. Their digital ID no longer verifies.']);
    }

    public function restore(int $id): JsonResponse
    {
        $student = Student::onlyTrashed()->findOrFail($id);
        $this->authorize('restore', $student);

        $student->restore();
        AuditLogger::record('student.restored', $student, metadata: ['student_number' => $student->student_number]);

        return response()->json(['message' => 'Student record restored.']);
    }

    private function filterIdStatus(Builder $query, string $status): Builder
    {
        return match ($status) {
            'approved', 'suspended', 'revoked' => $query->whereHas('digitalId', fn ($q) => $q->where('status', $status === 'approved' ? 'active' : $status)),
            default => $query->whereDoesntHave('digitalId')
                ->whereHas('latestApplication', fn ($q) => $q->where('status', $status)),
        };
    }
}
