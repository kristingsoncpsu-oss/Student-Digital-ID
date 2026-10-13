<?php

namespace App\Enums;

enum EnrollmentStatus: string
{
    case Enrolled = 'enrolled';
    case LeaveOfAbsence = 'leave_of_absence';
    case Graduated = 'graduated';
    case Withdrawn = 'withdrawn';

    public function label(): string
    {
        return match ($this) {
            self::Enrolled => 'Enrolled',
            self::LeaveOfAbsence => 'Leave of absence',
            self::Graduated => 'Graduated',
            self::Withdrawn => 'Withdrawn',
        };
    }
}
