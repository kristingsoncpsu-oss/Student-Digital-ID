<?php

namespace App\Http\Controllers\Api\Student;

use App\Enums\DigitalIdStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\DigitalIdResource;
use App\Http\Resources\StudentResource;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DigitalIdController extends Controller
{
    public function __invoke(Request $request, SettingsService $settings): JsonResponse
    {
        $student = $request->user()->student()->with(['digitalId', 'latestApplication'])->first();
        $digitalId = $student?->digitalId;

        // No ID until an application has been approved and the ID issued.
        if (! $student || ! $digitalId) {
            return response()->json([
                'status' => $student?->portalStatus() ?? 'incomplete',
                'digital_id' => null,
                'student' => $student ? StudentResource::make($student) : null,
                'message' => 'Your digital ID will be available once your application is approved.',
            ]);
        }

        $usable = $digitalId->isValid();

        return response()->json([
            'status' => $student->portalStatus(),
            'digital_id' => DigitalIdResource::make($digitalId),
            'student' => StudentResource::make($student),
            // The QR payload is only handed out while the ID is valid.
            'verification_url' => $usable ? url('/verify/'.$digitalId->plainToken()) : null,
            'institution' => $settings->public(),
            'suspended' => $digitalId->status === DigitalIdStatus::Suspended,
        ]);
    }
}
