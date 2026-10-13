<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Student */
class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $viewer = $request->user();
        $isStaff = $viewer?->isStaffMember() ?? false;

        return [
            'id' => $this->id,
            'student_number' => $this->student_number,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'suffix' => $this->suffix,
            'full_name' => $this->full_name,
            'school_email' => $this->school_email,
            'contact_number' => $this->contact_number,
            'program' => $this->program,
            'year_level' => $this->year_level,
            'address' => $this->address,
            'enrollment_status' => $this->enrollment_status->value,
            'enrollment_status_label' => $this->enrollment_status->label(),
            'photo_url' => $this->photo_path ? url("/api/students/{$this->id}/photo").'?v='.$this->updated_at?->timestamp : null,
            'portal_status' => $this->portalStatus(),
            'completion' => $this->completion(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'archived_at' => $this->when($isStaff, fn () => $this->deleted_at?->toIso8601String()),
            'account' => $this->when($isStaff, fn () => $this->relationLoaded('user') && $this->user ? [
                'id' => $this->user->id,
                'email' => $this->user->email,
                'email_verified' => $this->user->email_verified_at !== null,
            ] : null),
            'application' => ApplicationResource::make($this->whenLoaded('latestApplication')),
            'digital_id' => DigitalIdResource::make($this->whenLoaded('digitalId')),
        ];
    }
}
