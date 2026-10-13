<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApplicationResource;
use App\Http\Resources\DigitalIdResource;
use App\Http\Resources\StudentResource;
use App\Models\StudentIdApplication;
use App\Services\ApplicationService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ApplicationController extends Controller
{
    public function __construct(private ApplicationService $service)
    {
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', StudentIdApplication::class);

        $request->validate([
            'status' => ['nullable', Rule::in(['pending', 'approved', 'rejected'])],
            'per_page' => ['nullable', 'integer', 'between:5,100'],
        ]);

        $dir = $request->query('dir') === 'desc' ? 'desc' : 'asc';
        $status = $request->query('status', 'pending');

        $query = StudentIdApplication::query()
            ->with(['student', 'reviewer'])
            ->when($status !== 'all', fn (Builder $q) => $q->where('status', $status))
            ->when($request->filled('search'), function (Builder $q) use ($request) {
                $q->whereHas('student', fn ($s) => $s->withTrashed()->search($request->query('search')));
            })
            // Pending queue is oldest-first so nothing languishes; history is newest-first.
            ->orderBy('submitted_at', $status === 'pending' ? $dir : 'desc')
            ->orderBy('id');

        return ApplicationResource::collection($query->paginate($request->integer('per_page', 15))->withQueryString());
    }

    public function show(int $id): JsonResponse
    {
        $application = StudentIdApplication::with(['student.user', 'student.digitalId', 'reviewer'])->findOrFail($id);
        $this->authorize('view', $application);

        $student = $application->student;

        return response()->json([
            'application' => ApplicationResource::make($application),
            'student' => StudentResource::make($student->load('latestApplication')),
            'registry_check' => $this->service->registryCheck($student),
            'history' => ApplicationResource::collection(
                $student->applications()->with('reviewer')->latest('id')->get()
            ),
            'digital_id' => $student->digitalId ? DigitalIdResource::make($student->digitalId) : null,
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $application = StudentIdApplication::findOrFail($id);
        $this->authorize('review', $application);

        $data = $request->validate(['review_notes' => ['nullable', 'string', 'max:2000']]);
        $result = $this->service->approve($application, $request->user(), $data['review_notes'] ?? null);

        return response()->json([
            'message' => 'Application approved and digital ID issued.',
            'application' => ApplicationResource::make($result->load('reviewer')),
        ]);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $application = StudentIdApplication::findOrFail($id);
        $this->authorize('review', $application);

        $data = $request->validate([
            'rejection_reason' => ['required', 'string', 'min:10', 'max:1000'],
            'review_notes' => ['nullable', 'string', 'max:2000'],
        ], [
            'rejection_reason.required' => 'Please explain to the student why the application was not approved.',
            'rejection_reason.min' => 'The reason should be at least 10 characters so the student can understand it.',
        ]);

        $result = $this->service->reject($application, $request->user(), $data['rejection_reason'], $data['review_notes'] ?? null);

        return response()->json([
            'message' => 'Application rejected. The student can see your reason.',
            'application' => ApplicationResource::make($result->load('reviewer')),
        ]);
    }
}
