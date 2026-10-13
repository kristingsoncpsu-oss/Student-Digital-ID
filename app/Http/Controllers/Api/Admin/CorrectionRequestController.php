<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentRules;
use App\Http\Resources\CorrectionRequestResource;
use App\Models\CorrectionRequest;
use App\Models\Student;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CorrectionRequestController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', Student::class);

        $request->validate(['status' => ['nullable', Rule::in(['pending', 'approved', 'rejected', 'all'])]]);
        $status = $request->query('status', 'pending');

        $query = CorrectionRequest::query()
            ->with(['student', 'reviewer'])
            ->when($status !== 'all', fn ($q) => $q->where('status', $status))
            ->latest('id');

        return CorrectionRequestResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    /** Applies the requested value to the student record (photos are replaced by staff from the record page). */
    public function approve(Request $request, int $id): JsonResponse
    {
        $this->authorize('viewAny', Student::class);
        $data = $request->validate(['review_notes' => ['nullable', 'string', 'max:1000']]);

        DB::transaction(function () use ($id, $request, $data) {
            $correction = CorrectionRequest::with('student')->lockForUpdate()->findOrFail($id);
            abort_unless($correction->status === 'pending', 409, 'This request has already been reviewed.');

            $student = $correction->student;
            $this->authorize('update', $student);

            $changed = null;
            if ($correction->field !== 'photo') {
                $rules = StudentRules::full($student->id);
                $validator = Validator::make(
                    [$correction->field => $correction->requested_value],
                    [$correction->field => $rules[$correction->field]],
                    StudentRules::messages()
                );
                if ($validator->fails()) {
                    throw ValidationException::withMessages(['requested_value' => $validator->errors()->first()]);
                }

                $student->{$correction->field} = $correction->requested_value;
                $changed = $correction->field;
                $student->save();
            }

            $correction->forceFill([
                'status' => 'approved',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'review_notes' => $data['review_notes'] ?? null,
            ])->save();

            AuditLogger::record('correction.approved', $correction, metadata: [
                'student_id' => $student->id,
                'field' => $correction->field,
                'applied' => $changed !== null,
            ]);
        });

        return response()->json(['message' => 'Correction approved.']);
    }

    public function reject(Request $request, int $id): JsonResponse
    {
        $this->authorize('viewAny', Student::class);
        $data = $request->validate(['review_notes' => ['required', 'string', 'min:5', 'max:1000']]);

        DB::transaction(function () use ($id, $request, $data) {
            $correction = CorrectionRequest::lockForUpdate()->findOrFail($id);
            abort_unless($correction->status === 'pending', 409, 'This request has already been reviewed.');

            $correction->forceFill([
                'status' => 'rejected',
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'review_notes' => $data['review_notes'],
            ])->save();

            AuditLogger::record('correction.rejected', $correction, metadata: ['student_id' => $correction->student_id, 'field' => $correction->field]);
        });

        return response()->json(['message' => 'Correction request declined.']);
    }
}
