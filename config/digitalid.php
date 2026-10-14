<?php

/*
 | Defaults for institution branding and ID policy. Administrators can override
 | most of these at runtime from Settings (stored in the `settings` table).
 */
return [
    'defaults' => [
        'institution_name' => 'Central Philippines State University',
        'institution_short' => 'CPSU-SCC',
        'department_name' => 'College of Computer Studies',
        'campus_note' => 'Negros Occidental',
        'support_email' => 'ccs-registrar@example.edu',
        'support_phone' => '+63 000 000 0000',
        'id_validity_months' => null,
        'id_back_note' => 'This card is the property of the institution. If found, please return it to the registrar.',
        'collect_address' => false,
        'require_registry_match' => false,
        'verify_show_name' => true,
        'verify_show_program' => true,
        'verify_mask_number' => true,
        'programs' => [
            'Bachelor of Science in Information Technology',
        ],
    ],

    'logos' => [
        'institution' => '/images/cpsu-logo.png',
        'department' => '/images/ccs-logo.png',
    ],

    'photo' => [
        'disk' => 'local',
        'directory' => 'student-photos',
        'max_kb' => 2048,
    ],
];
