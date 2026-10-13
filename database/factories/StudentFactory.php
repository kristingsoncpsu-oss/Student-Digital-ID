<?php

namespace Database\Factories;

use App\Enums\EnrollmentStatus;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        $first = fake()->firstName();
        $last = fake()->lastName();

        return [
            'user_id' => User::factory(),
            'student_number' => 'T-'.fake()->unique()->numerify('######'),
            'first_name' => $first,
            'middle_name' => null,
            'last_name' => $last,
            'suffix' => null,
            'school_email' => strtolower($first.'.'.$last.fake()->unique()->numerify('##')).'@students.example.edu',
            'contact_number' => '09'.fake()->numerify('#########'),
            'program' => 'Bachelor of Science in Information Technology',
            'year_level' => fake()->numberBetween(1, 4),
            'enrollment_status' => EnrollmentStatus::Enrolled,
        ];
    }
}
