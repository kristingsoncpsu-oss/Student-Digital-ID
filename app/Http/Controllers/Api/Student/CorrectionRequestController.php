<?php

namespace App\Http\Controllers\Api\Student;

use App\Http\Controllers\Controller;
use App\Http\Resources\CorrectionRequestResource;
use App\Models\CorrectionRequest;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CorrectionRequestController extends Controller
{
    public function index(Request $request)
    {
        $student = $request->user()->student;

        return CorrectionRequestResource::collection(
            $student ? $student->correctionRequests()->latest()->get() : collect()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $student = $request->user()->student;
        abort_unless($student, 422, 'Submit your student information before requesting corrections.');

        $data = $request->validate([
            'field' => ['required', Rule::in(CorrectionRequest::FIELDS)],
            'requested_value' => ['nullable', 'string', 'max:255', 'required_unless:field,photo'],
            'reason' => ['required', 'string', 'min:10', 'max:1000'],
        ]);

        if ($student->correctionRequests()->where('field', $data['field'])->where('status', 'pending')->exists()) {
            throw ValidationException::withMessages(['field' => 'You already have a pending request for this field.']);
        }

        $correction = $student->correctionRequests()->create($data);
        AuditLogger::record('correction.requested', $correction, metadata: ['field' => $data['field'], 'student_id' => $student->id]);

        return response()->json([
            'message' => 'Correction request sent to the registrar.',
            'correction' => CorrectionRequestResource::make($correction),
        ], 201);
    }
}
