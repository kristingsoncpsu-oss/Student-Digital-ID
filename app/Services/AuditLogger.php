<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditLogger
{
    /** Keys that must never be written to the audit trail. */
    private const FORBIDDEN = ['password', 'password_confirmation', 'token', 'verification_token', 'remember_token'];

    /**
     * @param  array<string, mixed>  $metadata  safe, non-secret context only
     */
    public static function record(string $action, Model|string $target, ?int $targetId = null, array $metadata = [], ?User $actor = null): AuditLog
    {
        if ($target instanceof Model) {
            $targetId = $target->getKey();
            $target = self::typeFor($target);
        }

        $actor ??= auth()->user();

        return AuditLog::create([
            'actor_user_id' => $actor?->getKey(),
            'action' => $action,
            'target_type' => $target,
            'target_id' => $targetId,
            'metadata' => self::clean($metadata) ?: null,
            'ip_address' => request()?->ip(),
        ]);
    }

    private static function typeFor(Model $model): string
    {
        return match (class_basename($model)) {
            'StudentIdApplication' => 'application',
            'DigitalId' => 'digital_id',
            'CorrectionRequest' => 'correction_request',
            default => strtolower(class_basename($model)),
        };
    }

    private static function clean(array $metadata): array
    {
        return collect($metadata)
            ->reject(fn ($v, $k) => in_array(strtolower((string) $k), self::FORBIDDEN, true))
            ->all();
    }
}
