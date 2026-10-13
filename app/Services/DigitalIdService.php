<?php

namespace App\Services;

use App\Enums\DigitalIdStatus;
use App\Models\DigitalId;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class DigitalIdService
{
    public function __construct(private SettingsService $settings)
    {
    }

    /**
     * Issue (or re-activate with a fresh token) the single digital ID for a student.
     * Must be called inside a transaction. The unique(student_id) constraint makes
     * duplicate issuance impossible even under concurrent requests.
     */
    public function issue(Student $student, User $issuer): DigitalId
    {
        $token = DigitalId::newToken();
        $months = $this->settings->get('id_validity_months');
        $expires = filled($months) ? now()->addMonths((int) $months) : null;

        $digitalId = DigitalId::query()->where('student_id', $student->id)->lockForUpdate()->first()
            ?? new DigitalId(['student_id' => $student->id]);

        $digitalId->forceFill([
            'student_id' => $student->id,
            'verification_token_hash' => DigitalId::hashToken($token),
            'verification_token_encrypted' => Crypt::encryptString($token),
            'status' => DigitalIdStatus::Active,
            'issued_at' => now(),
            'expires_at' => $expires,
            'suspended_at' => null,
            'revoked_at' => null,
            'status_reason' => null,
            'issued_by' => $issuer->id,
        ])->save();

        return $digitalId;
    }

    public function suspend(DigitalId $digitalId, string $reason, User $actor): DigitalId
    {
        return $this->transition($digitalId, DigitalIdStatus::Suspended, $reason, $actor, 'digital_id.suspended');
    }

    public function revoke(DigitalId $digitalId, string $reason, User $actor): DigitalId
    {
        return $this->transition($digitalId, DigitalIdStatus::Revoked, $reason, $actor, 'digital_id.revoked');
    }

    public function reactivate(DigitalId $digitalId, User $actor): DigitalId
    {
        return DB::transaction(function () use ($digitalId, $actor) {
            $locked = DigitalId::query()->lockForUpdate()->findOrFail($digitalId->id);
            abort_unless($locked->status === DigitalIdStatus::Suspended, 409, 'Only a suspended ID can be reactivated.');

            $locked->forceFill([
                'status' => DigitalIdStatus::Active,
                'suspended_at' => null,
                'status_reason' => null,
            ])->save();

            AuditLogger::record('digital_id.reactivated', $locked, metadata: ['student_id' => $locked->student_id], actor: $actor);

            return $locked;
        });
    }

    /** Invalidate the printed/shared QR and issue a new token (e.g. if a card image leaked). */
    public function rotateToken(DigitalId $digitalId, User $actor): DigitalId
    {
        return DB::transaction(function () use ($digitalId, $actor) {
            $locked = DigitalId::query()->lockForUpdate()->findOrFail($digitalId->id);
            $token = DigitalId::newToken();

            $locked->forceFill([
                'verification_token_hash' => DigitalId::hashToken($token),
                'verification_token_encrypted' => Crypt::encryptString($token),
            ])->save();

            AuditLogger::record('digital_id.token_rotated', $locked, metadata: ['student_id' => $locked->student_id], actor: $actor);

            return $locked;
        });
    }

    private function transition(DigitalId $digitalId, DigitalIdStatus $to, string $reason, User $actor, string $action): DigitalId
    {
        return DB::transaction(function () use ($digitalId, $to, $reason, $actor, $action) {
            $locked = DigitalId::query()->lockForUpdate()->findOrFail($digitalId->id);
            abort_if($locked->status === DigitalIdStatus::Revoked, 409, 'This ID has already been revoked.');
            abort_if($locked->status === $to, 409, 'This ID is already '.$to->value.'.');

            $locked->forceFill([
                'status' => $to,
                'status_reason' => $reason,
                'suspended_at' => $to === DigitalIdStatus::Suspended ? now() : $locked->suspended_at,
                'revoked_at' => $to === DigitalIdStatus::Revoked ? now() : null,
            ])->save();

            AuditLogger::record($action, $locked, metadata: ['student_id' => $locked->student_id, 'reason' => $reason], actor: $actor);

            return $locked;
        });
    }
}
