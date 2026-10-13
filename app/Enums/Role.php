<?php

namespace App\Enums;

enum Role: string
{
    case Student = 'student';
    case Staff = 'staff';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Student => 'Student',
            self::Staff => 'Registrar / Staff',
            self::Admin => 'Administrator',
        };
    }
}
