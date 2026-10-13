<?php

namespace Database\Seeders;

use App\Enums\EnrollmentStatus;
use App\Enums\Role;
use App\Models\EnrollmentRecord;
use App\Models\Student;
use App\Models\StudentIdApplication;
use App\Models\User;
use App\Services\ApplicationService;
use App\Services\DigitalIdService;
use Illuminate\Database\Seeder;

/**
 * Fictional demo data for local development.
 * Every person here is invented; student numbers are prefixed DEMO-.
 *
 * Local-only credentials (password for all demo accounts): DemoPass#2026
 */
class DemoDataSeeder extends Seeder
{
    private const PASSWORD = 'DemoPass#2026';

    private const FIRST = ['Alden', 'Bianca', 'Carlo', 'Dana', 'Elijah', 'Faye', 'Gabriel', 'Hannah', 'Ian', 'Jasmine', 'Kyle', 'Lara', 'Marco', 'Nina', 'Oscar', 'Paula', 'Quinn', 'Rafael', 'Sofia', 'Tomas', 'Uma', 'Victor', 'Wendy', 'Yuri'];

    private const LAST = ['Abello', 'Bautista', 'Calderon', 'Dizon', 'Espina', 'Fuentes', 'Gonzales', 'Hernando', 'Ibarra', 'Jacinto', 'Lacson', 'Mabini', 'Navarro', 'Ortega', 'Pascual', 'Quiambao', 'Ramos', 'Santillan', 'Tolentino', 'Uy', 'Valencia', 'Yap', 'Zamora', 'Aquino'];

    public function run(): void
    {
        $admin = $this->account('System Administrator (demo)', 'admin@ccs.example.test', Role::Admin);
        $registrar = $this->account('Registrar Staff (demo)', 'registrar@ccs.example.test', Role::Staff);

        $programs = config('digitalid.defaults.programs');
        $applications = app(ApplicationService::class);
        $digitalIds = app(DigitalIdService::class);

        // Hand-picked accounts for trying each state in the UI.
        $scenarios = [
            // [index, status]
            [0, 'approved'], [1, 'pending'], [2, 'rejected'], [3, 'suspended'],
        ];
        $named = [0 => 'student.approved', 1 => 'student.pending', 2 => 'student.rejected', 3 => 'student.suspended'];

        for ($i = 0; $i < count(self::FIRST); $i++) {
            $first = self::FIRST[$i];
            $last = self::LAST[$i];
            $number = sprintf('DEMO-2026-%04d', $i + 1);
            $status = match (true) {
                $i < 4 => $scenarios[$i][1],
                $i < 16 => 'approved',
                $i < 21 => 'pending',
                $i < 23 => 'rejected',
                default => 'suspended',
            };

            $email = isset($named[$i]) ? $named[$i].'@ccs.example.test' : strtolower("$first.$last").'@ccs.example.test';

            // Spread registrations across the last 30 days so trend charts have shape.
            $registeredAt = now()->subDays(29 - (($i * 7) % 30))->subHours($i);

            $user = User::where('email', $email)->first() ?? $this->account("$first $last", $email, Role::Student);
            $user->forceFill(['created_at' => $registeredAt])->save();

            if ($user->student()->withTrashed()->exists()) {
                continue;
            }

            $student = new Student([
                'student_number' => $number,
                'first_name' => $first,
                'last_name' => $last,
                'school_email' => strtolower("demo.$first.$last").'@students.example.edu',
                'contact_number' => '0900000'.sprintf('%04d', $i),
                'program' => $programs[$i % count($programs)],
                'year_level' => ($i % 4) + 1,
            ]);
            $student->user_id = $user->id;
            $student->created_by = $user->id;
            $student->enrollment_status = EnrollmentStatus::Enrolled;
            $student->created_at = $registeredAt;
            $student->save();

            // Authoritative registry record for the demo student.
            EnrollmentRecord::updateOrCreate(['student_number' => $number], [
                'first_name' => $first,
                'last_name' => $last,
                'program' => $student->program,
                'year_level' => $student->year_level,
            ]);

            $application = $applications->submit($student);
            $application->forceFill(['submitted_at' => $registeredAt->copy()->addHours(2)])->save();

            if ($status === 'approved' || $status === 'suspended') {
                $applications->approve($application, $registrar, 'Verified against the enrollment registry (demo).');
                if ($status === 'suspended') {
                    $digitalIds->suspend($student->fresh()->digitalId, 'Demo: pending clearance of records.', $registrar);
                }
            } elseif ($status === 'rejected') {
                $applications->reject(
                    $application,
                    $registrar,
                    'The submitted photo is not a clear, front-facing portrait. Please upload a new photo and resubmit.',
                    'Demo internal note: photo blurry.'
                );
            }
        }

        // A few registry records with no account yet, so staff can see "matched" lookups on new submissions.
        foreach ([['DEMO-2026-0101', 'Mika', 'Delos Reyes'], ['DEMO-2026-0102', 'Noel', 'Evangelista']] as [$n, $f, $l]) {
            EnrollmentRecord::updateOrCreate(['student_number' => $n], [
                'first_name' => $f, 'last_name' => $l, 'program' => $programs[0], 'year_level' => 2,
            ]);
        }

        $this->command?->info('Demo data seeded (all fictional). Password for every demo account: '.self::PASSWORD);
    }

    private function account(string $name, string $email, Role $role): User
    {
        $user = User::where('email', $email)->first() ?? new User(['name' => $name, 'email' => $email, 'password' => self::PASSWORD]);
        $user->role = $role;
        $user->is_active = true;
        $user->email_verified_at = now();
        $user->save();

        return $user;
    }
}
