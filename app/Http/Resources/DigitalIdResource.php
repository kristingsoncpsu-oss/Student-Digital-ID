<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DigitalId */
class DigitalIdResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isStaff = $request->user()?->isStaffMember() ?? false;

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'is_valid' => $this->isValid(),
            'is_expired' => $this->isExpired(),
            'issued_at' => $this->issued_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'suspended_at' => $this->suspended_at?->toIso8601String(),
            'revoked_at' => $this->revoked_at?->toIso8601String(),
            'status_reason' => $this->when($isStaff, $this->status_reason),
            'student' => StudentResource::make($this->whenLoaded('student')),
        ];
    }
}
