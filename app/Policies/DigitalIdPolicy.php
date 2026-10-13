<?php

namespace App\Policies;

use App\Models\DigitalId;
use App\Models\User;

class DigitalIdPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active && $user->isStaffMember();
    }

    public function view(User $user, DigitalId $digitalId): bool
    {
        if (! $user->is_active) {
            return false;
        }

        return $user->isStaffMember()
            || ($digitalId->student?->user_id !== null && $digitalId->student->user_id === $user->id);
    }

    /** Suspend, reactivate, revoke, rotate token. */
    public function manage(User $user, DigitalId $digitalId): bool
    {
        return $user->is_active && $user->isStaffMember();
    }
}
