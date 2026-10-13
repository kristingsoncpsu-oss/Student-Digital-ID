<?php

namespace App\Models;

use App\Enums\DigitalIdStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class DigitalId extends Model
{
    // Written only by DigitalIdService (never from request input).
    protected $guarded = [];

    protected $hidden = ['verification_token_hash', 'verification_token_encrypted'];

    protected function casts(): array
    {
        return [
            'status' => DigitalIdStatus::class,
            'issued_at' => 'datetime',
            'expires_at' => 'datetime',
            'suspended_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class)->withTrashed();
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /** 48 random chars (~285 bits): not derived from any database id. */
    public static function newToken(): string
    {
        return Str::random(48);
    }

    public function plainToken(): string
    {
        return Crypt::decryptString($this->verification_token_encrypted);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /** Whether this ID may be presented as valid right now (checked server-side on every scan). */
    public function isValid(): bool
    {
        return $this->status === DigitalIdStatus::Active
            && ! $this->isExpired()
            && $this->student !== null
            && ! $this->student->trashed();
    }
}
