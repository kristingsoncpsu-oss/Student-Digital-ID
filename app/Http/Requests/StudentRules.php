<?php

namespace App\Http\Requests;

use App\Services\SettingsService;
use Illuminate\Validation\Rule;

class StudentRules
{
    private const NAME = '/^[\p{L}\p{M}\s.\'’-]+$/u';

    /** Full rule set for a student record. Pass the record's id when updating. */
    public static function full(?int $ignoreStudentId = null): array
    {
        $settings = app(SettingsService::class);
        $programs = array_values($settings->get('programs', []));

        return [
            'student_number' => [
                'required', 'string', 'regex:/^[A-Za-z0-9\-]{4,32}$/',
                Rule::unique('students', 'student_number')->ignore($ignoreStudentId),
            ],
            'first_name' => ['required', 'string', 'max:100', 'regex:'.self::NAME],
            'middle_name' => ['nullable', 'string', 'max:100', 'regex:'.self::NAME],
            'last_name' => ['required', 'string', 'max:100', 'regex:'.self::NAME],
            'suffix' => ['nullable', 'string', 'max:20'],
            'school_email' => [
                'required', 'email:rfc', 'max:255',
                Rule::unique('students', 'school_email')->ignore($ignoreStudentId),
            ],
            'contact_number' => ['required', 'string', 'regex:/^[0-9+\-\s()]{7,20}$/'],
            'program' => ['required', 'string', 'max:150', $programs ? Rule::in($programs) : 'string'],
            'year_level' => ['required', 'integer', 'between:1,6'],
            'address' => [$settings->get('collect_address') ? 'nullable' : 'prohibited', 'string', 'max:255'],
            'photo' => self::photo(),
        ];
    }

    /** Rules for the only fields a student may edit after their ID has been approved. */
    public static function limited(): array
    {
        $full = self::full();

        return [
            'contact_number' => $full['contact_number'],
            'address' => $full['address'],
        ];
    }

    public static function photo(): array
    {
        return [
            'nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp',
            'max:'.config('digitalid.photo.max_kb'),
            'dimensions:min_width=200,min_height=200,max_width=4000,max_height=4000',
        ];
    }

    public static function messages(): array
    {
        return [
            'student_number.unique' => 'This student number is already registered.',
            'student_number.regex' => 'Use 4–32 letters, numbers or hyphens.',
            'school_email.unique' => 'This school email is already registered to another student.',
            'contact_number.regex' => 'Enter a valid contact number (digits, +, -, spaces).',
            'first_name.regex' => 'Names may only contain letters, spaces, apostrophes, periods and hyphens.',
            'last_name.regex' => 'Names may only contain letters, spaces, apostrophes, periods and hyphens.',
            'middle_name.regex' => 'Names may only contain letters, spaces, apostrophes, periods and hyphens.',
            'photo.max' => 'The photo must not be larger than 2 MB.',
            'photo.dimensions' => 'The photo must be between 200×200 and 4000×4000 pixels.',
            'program.in' => 'Please choose a program from the list.',
            'address.prohibited' => 'Address is not collected by this institution.',
        ];
    }
}
