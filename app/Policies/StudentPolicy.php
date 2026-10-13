<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active && $user->isStaffMember();
    }

    /** Staff may view any record; a student may only ever view the record linked to their own account. */
    public function view(User $user, Student $student): bool
    {
        if (! $user->is_active) {
            return false;
        }

        return $user->isStaffMember()
            || ($student->user_id !== null && $student->user_id === $user->id);
    }

    public function create(User $user): bool
    {
        return $user->is_active && $user->isStaffMember();
    }

    public function update(User $user, Student $student): bool
    {
        return $user->is_active && $user->isStaffMember();
    }

    public function delete(User $user, Student $student): bool
    {
        return $user->is_active && $user->isStaffMember();
    }

    public function restore(User $user, Student $student): bool
    {
        return $user->is_active && $user->isAdmin();
    }
}
