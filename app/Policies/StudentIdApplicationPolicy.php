<?php

namespace App\Policies;

use App\Models\StudentIdApplication;
use App\Models\User;

class StudentIdApplicationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active && $user->isStaffMember();
    }

    public function view(User $user, StudentIdApplication $application): bool
    {
        if (! $user->is_active) {
            return false;
        }

        return $user->isStaffMember()
            || ($application->student?->user_id !== null && $application->student->user_id === $user->id);
    }

    /** Approve / reject. Students can never review, including their own application. */
    public function review(User $user, StudentIdApplication $application): bool
    {
        return $user->is_active && $user->isStaffMember();
    }
}
