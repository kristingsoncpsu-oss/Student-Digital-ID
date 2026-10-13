<?php

namespace Tests;

use App\Models\DigitalId;
use App\Models\Student;
use App\Models\StudentIdApplication;
use App\Models\User;
use App\Services\ApplicationService;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Behave like the SPA: requests come from a Sanctum "stateful" frontend origin.
        $this->withHeaders(['Origin' => 'http://localhost', 'Referer' => 'http://localhost/']);
    }

    /**
     * A real, solid-colour PNG built without the GD extension.
     * $padKb appends trailing bytes (ignored by image readers) to test size limits.
     */
    protected function fakePhoto(string $name = 'photo.png', int $size = 240, int $padKb = 0): \Illuminate\Http\UploadedFile
    {
        $row = "\x00".str_repeat("\x1e\x3a\x8a", $size);
        $raw = str_repeat($row, $size);
        $chunk = fn (string $type, string $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));

        $png = "\x89PNG\r\n\x1a\n"
            .$chunk('IHDR', pack('NNCCCCC', $size, $size, 8, 2, 0, 0, 0))
            .$chunk('IDAT', gzcompress($raw, 9))
            .$chunk('IEND', '');

        if ($padKb > 0) {
            $png .= str_repeat("\0", $padKb * 1024);
        }

        return \Illuminate\Http\UploadedFile::fake()->createWithContent($name, $png);
    }

    protected function student(array $userState = [], array $attrs = []): Student
    {
        $user = User::factory()->create($userState);

        return Student::factory()->create(array_merge(['user_id' => $user->id], $attrs));
    }

    protected function staff(): User
    {
        return User::factory()->staff()->create();
    }

    protected function admin(): User
    {
        return User::factory()->admin()->create();
    }

    /** A student with a pending application. */
    protected function pending(array $attrs = []): StudentIdApplication
    {
        $student = $this->student([], $attrs);

        return app(ApplicationService::class)->submit($student);
    }

    /** A student with an approved application and an active digital ID. */
    protected function approvedStudent(array $attrs = []): Student
    {
        $application = $this->pending($attrs);
        app(ApplicationService::class)->approve($application, $this->staff());

        return $application->student->fresh(['digitalId', 'user']);
    }

    protected function tokenFor(Student $student): string
    {
        return DigitalId::where('student_id', $student->id)->firstOrFail()->plainToken();
    }

    protected function validProfile(array $overrides = []): array
    {
        return array_merge([
            'student_number' => 'DEMO-2026-9001',
            'first_name' => 'Juan',
            'middle_name' => 'Dela',
            'last_name' => 'Cruz',
            'school_email' => 'juan.cruz@students.example.edu',
            'contact_number' => '09171234567',
            'program' => 'Bachelor of Science in Information Technology',
            'year_level' => 2,
        ], $overrides);
    }
}
