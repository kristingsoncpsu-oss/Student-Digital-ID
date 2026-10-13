<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use App\Enums\DigitalIdStatus;
use App\Enums\EnrollmentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    /** Fields a student may never change directly once their ID has been approved. */
    public const PROTECTED_FIELDS = [
        'student_number', 'first_name', 'middle_name', 'last_name', 'suffix',
        'school_email', 'program', 'year_level', 'photo',
    ];

    protected $fillable = [
        'student_number', 'first_name', 'middle_name', 'last_name', 'suffix',
        'school_email', 'contact_number', 'program', 'year_level', 'address',
    ];

    protected function casts(): array
    {
        return [
            'year_level' => 'integer',
            'enrollment_status' => EnrollmentStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(StudentIdApplication::class);
    }

    public function latestApplication(): HasOne
    {
        return $this->hasOne(StudentIdApplication::class)->latestOfMany();
    }

    public function digitalId(): HasOne
    {
        return $this->hasOne(DigitalId::class);
    }

    public function correctionRequests(): HasMany
    {
        return $this->hasMany(CorrectionRequest::class);
    }

    public function getFullNameAttribute(): string
    {
        return collect([$this->first_name, $this->middle_name, $this->last_name, $this->suffix])
            ->filter()->implode(' ');
    }

    /**
     * Single status the student sees:
     * incomplete | pending | approved | rejected | suspended | revoked
     */
    public function portalStatus(): string
    {
        $digitalId = $this->relationLoaded('digitalId') ? $this->digitalId : $this->digitalId()->first();

        if ($digitalId) {
            return match ($digitalId->status) {
                DigitalIdStatus::Active => 'approved',
                DigitalIdStatus::Suspended => 'suspended',
                DigitalIdStatus::Revoked => 'revoked',
            };
        }

        $application = $this->relationLoaded('latestApplication')
            ? $this->latestApplication
            : $this->latestApplication()->first();

        return match ($application?->status) {
            ApplicationStatus::Rejected => 'rejected',
            ApplicationStatus::Pending, ApplicationStatus::Approved => 'pending',
            default => 'incomplete',
        };
    }

    /** Percent of the key profile fields that are filled in. */
    public function completion(): int
    {
        $checks = [
            $this->student_number, $this->first_name, $this->last_name, $this->school_email,
            $this->contact_number, $this->program, $this->year_level, $this->photo_path,
        ];

        return (int) round(count(array_filter($checks)) / count($checks) * 100);
    }

    public function scopeSearch(Builder $query, ?string $term): Builder
    {
        if (! filled($term)) {
            return $query;
        }
        $like = '%'.addcslashes(trim($term), '%_\\').'%';

        return $query->where(function (Builder $q) use ($like) {
            $q->where('student_number', 'like', $like)
                ->orWhere('first_name', 'like', $like)
                ->orWhere('last_name', 'like', $like)
                ->orWhere('school_email', 'like', $like);
        });
    }
}
