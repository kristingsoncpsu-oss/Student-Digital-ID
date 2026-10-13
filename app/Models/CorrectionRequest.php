<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CorrectionRequest extends Model
{
    /** Fields a student may ask staff to correct. */
    public const FIELDS = [
        'student_number', 'first_name', 'middle_name', 'last_name', 'suffix',
        'school_email', 'program', 'year_level', 'photo',
    ];

    protected $fillable = ['field', 'requested_value', 'reason'];

    protected function casts(): array
    {
        return ['reviewed_at' => 'datetime'];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class)->withTrashed();
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
