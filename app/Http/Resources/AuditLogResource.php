<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\AuditLog */
class AuditLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'target_type' => $this->target_type,
            'target_id' => $this->target_id,
            'metadata' => $this->metadata,
            'actor' => $this->actor ? ['id' => $this->actor->id, 'name' => $this->actor->name, 'role' => $this->actor->role->value] : null,
            'ip_address' => $request->user()?->isAdmin() ? $this->ip_address : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
