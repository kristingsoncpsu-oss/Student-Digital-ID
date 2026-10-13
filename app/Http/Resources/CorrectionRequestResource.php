<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\CorrectionRequest */
class CorrectionRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isStaff = $request->user()?->isStaffMember() ?? false;

        return [
            'id' => $this->id,
            'field' => $this->field,
            'requested_value' => $this->requested_value,
            'reason' => $this->reason,
            'status' => $this->status,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'review_notes' => $this->review_notes,
            'reviewer' => $this->when($isStaff, fn () => $this->reviewer?->name),
            'student' => $this->when($isStaff, fn () => StudentResource::make($this->whenLoaded('student'))),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
