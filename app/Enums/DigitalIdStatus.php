<?php

namespace App\Enums;

enum DigitalIdStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case Revoked = 'revoked';
}
