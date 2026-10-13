<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\StudentIdApplication */
class ApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isStaff = $request->user()?->isStaffMember() ?? false;

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            // Explanation intended for the student.
            'rejection_reason' => $this->rejection_reason,
            // Internal staff-only fields are never serialised for students.
            'review_notes' => $this->when($isStaff, $this->review_notes),
            'reviewer' => $this->when($isStaff, fn () => $this->reviewer?->name),
            'student' => StudentResource::make($this->whenLoaded('student')),
        ];
    }
}
