<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudentProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_submits_information_and_gets_a_pending_application(): void
    {
        Storage::fake('local');
        $user = User::factory()->create();

        $this->actingAs($user)->post('/api/student/profile', $this->validProfile([
            'photo' => $this->fakePhoto('me.png'),
        ]), ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('student.portal_status', 'pending')
            ->assertJsonPath('student.application.status', 'pending');

        $student = $user->student()->first();
        $this->assertNotNull($student->photo_path);
        Storage::disk('local')->assertExists($student->photo_path);
        $this->assertDatabaseHas('student_id_applications', ['student_id' => $student->id, 'status' => 'pending']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'student.profile_submitted']);
    }

    public function test_required_fields_are_validated(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/student/profile', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['student_number', 'first_name', 'last_name', 'school_email', 'contact_number', 'program', 'year_level']);
    }

    public function test_duplicate_student_number_is_rejected(): void
    {
        $this->student(attrs: ['student_number' => 'DEMO-2026-9001']);

        $this->actingAs(User::factory()->create())->postJson('/api/student/profile', $this->validProfile())
            ->assertUnprocessable()->assertJsonValidationErrors('student_number');
    }

    public function test_student_cannot_submit_twice(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/api/student/profile', $this->validProfile())->assertCreated();

        $this->actingAs($user)->postJson('/api/student/profile', $this->validProfile([
            'student_number' => 'DEMO-2026-9002', 'school_email' => 'second@students.example.edu',
        ]))->assertStatus(409);
    }

    public function test_photo_type_and_size_are_validated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post('/api/student/profile', $this->validProfile([
            'photo' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
        ]), ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('photo');

        $this->actingAs($user)->post('/api/student/profile', $this->validProfile([
            'photo' => $this->fakePhoto('big.png', 240, 3000),
        ]), ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors('photo');
    }

    public function test_student_cannot_set_protected_administrative_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/student/profile', $this->validProfile([
            'enrollment_status' => 'graduated', 'user_id' => 999, 'status' => 'approved', 'created_by' => 999,
        ]))->assertCreated();

        $student = $user->student()->first();
        $this->assertSame('enrolled', $student->enrollment_status->value);
        $this->assertSame($user->id, $student->user_id);
        $this->assertDatabaseMissing('digital_ids', ['student_id' => $student->id]);
        $this->assertSame('pending', $student->applications()->first()->status->value);
    }

    public function test_approved_student_can_only_edit_contact_details(): void
    {
        $student = $this->approvedStudent();

        $this->actingAs($student->user)->putJson('/api/student/profile', [
            'contact_number' => '09998887777',
        ])->assertOk();
        $this->assertSame('09998887777', $student->fresh()->contact_number);

        $this->actingAs($student->user)->putJson('/api/student/profile', [
            'contact_number' => '09998887777', 'last_name' => 'Changed',
        ])->assertUnprocessable()->assertJsonValidationErrors('last_name');
        $this->assertNotSame('Changed', $student->fresh()->last_name);
    }

    public function test_student_can_request_a_correction_and_staff_can_apply_it(): void
    {
        $student = $this->approvedStudent();

        $this->actingAs($student->user)->postJson('/api/student/corrections', [
            'field' => 'last_name', 'requested_value' => 'Delos Santos', 'reason' => 'Surname was misspelled at enrollment.',
        ])->assertCreated();

        // A second pending request for the same field is refused.
        $this->actingAs($student->user)->postJson('/api/student/corrections', [
            'field' => 'last_name', 'requested_value' => 'X', 'reason' => 'Another attempt at the same field.',
        ])->assertUnprocessable();

        $id = \App\Models\CorrectionRequest::first()->id;

        // Students cannot approve their own correction.
        $this->actingAs($student->user)->postJson("/api/admin/corrections/{$id}/approve")->assertForbidden();

        $this->actingAs($this->staff())->postJson("/api/admin/corrections/{$id}/approve")->assertOk();
        $this->assertSame('Delos Santos', $student->fresh()->last_name);
    }

    public function test_rejected_student_can_correct_and_resubmit(): void
    {
        $application = $this->pending();
        $student = $application->student;
        $this->actingAs($this->staff())->postJson("/api/admin/applications/{$application->id}/reject", [
            'rejection_reason' => 'The student number does not match our records.',
            'review_notes' => 'Internal: check with dean.',
        ])->assertOk();

        $this->actingAs($student->user)->getJson('/api/student/dashboard')
            ->assertJsonPath('status', 'rejected')
            ->assertJsonPath('student.application.rejection_reason', 'The student number does not match our records.')
            ->assertJsonMissingPath('student.application.review_notes');

        $this->actingAs($student->user)->putJson('/api/student/profile', [
            'student_number' => 'DEMO-2026-7777', 'first_name' => $student->first_name, 'last_name' => $student->last_name,
            'school_email' => $student->school_email, 'contact_number' => $student->contact_number,
            'program' => $student->program, 'year_level' => $student->year_level,
        ])->assertOk();

        $this->assertSame(2, $student->applications()->count());
        $this->assertSame('pending', $student->fresh()->portalStatus());
    }
}
