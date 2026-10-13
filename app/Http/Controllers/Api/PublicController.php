<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DigitalId;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    public function __construct(private SettingsService $settings)
    {
    }

    public function settings(): JsonResponse
    {
        return response()->json(['settings' => $this->settings->public()]);
    }

    /**
     * Public QR verification. Returns the bare minimum, always re-evaluated against
     * the current server-side status, so a suspended/revoked/expired ID cannot keep
     * passing because of a QR that was generated earlier.
     */
    public function verify(string $token): JsonResponse
    {
        $institution = $this->settings->get('institution_name');
        $invalid = fn (string $status, string $message) => response()->json([
            'valid' => false,
            'status' => $status,
            'message' => $message,
            'institution' => $institution,
        ]);

        // Cheap shape check before touching the database.
        if (! preg_match('/^[A-Za-z0-9]{48}$/', $token)) {
            return $invalid('unknown', 'This code is not recognised.');
        }

        $digitalId = DigitalId::query()
            ->with(['student' => fn ($q) => $q->withTrashed()])
            ->where('verification_token_hash', DigitalId::hashToken($token))
            ->first();

        if (! $digitalId) {
            return $invalid('unknown', 'This code is not recognised.');
        }

        if (! $digitalId->isValid()) {
            // No personal data for IDs that are not currently valid.
            $status = $digitalId->isExpired() && $digitalId->status->value === 'active'
                ? 'expired'
                : ($digitalId->student?->trashed() ? 'revoked' : $digitalId->status->value);

            return $invalid($status, 'This student ID is not currently valid.');
        }

        $student = $digitalId->student;
        $number = $student->student_number;

        return response()->json([
            'valid' => true,
            'status' => 'active',
            'message' => 'This student ID is valid.',
            'institution' => $institution,
            'student' => [
                'name' => $this->settings->get('verify_show_name') ? $student->full_name : null,
                'student_number' => $this->settings->get('verify_mask_number') ? $this->mask($number) : $number,
                'program' => $this->settings->get('verify_show_program') ? $student->program : null,
                'enrollment_status' => $student->enrollment_status->label(),
            ],
            'valid_until' => $digitalId->expires_at?->toDateString(),
            'checked_at' => now()->toIso8601String(),
        ]);
    }

    private function mask(string $number): string
    {
        $len = strlen($number);
        if ($len <= 4) {
            return str_repeat('•', $len);
        }

        return str_repeat('•', $len - 4).substr($number, -4);
    }
}
