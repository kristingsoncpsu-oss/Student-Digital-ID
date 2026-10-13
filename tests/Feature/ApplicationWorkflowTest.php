<?php

namespace Tests\Feature;

use App\Models\DigitalId;
use App\Models\EnrollmentRecord;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApplicationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_approval_issues_exactly_one_digital_id(): void
    {
        $application = $this->pending();
        $staff = $this->staff();

        $this->actingAs($staff)->postJson("/api/admin/applications/{$application->id}/approve", ['review_notes' => 'ok'])
            ->assertOk();

        $application->refresh();
        $this->assertSame('approved', $application->status->value);
        $this->assertSame($staff->id, $application->reviewed_by);
        $this->assertNotNull($application->reviewed_at);
        $this->assertSame(1, DigitalId::where('student_id', $application->student_id)->count());
        $this->assertDatabaseHas('audit_logs', ['action' => 'application.approved', 'actor_user_id' => $staff->id]);
        $this->assertDatabaseHas('audit_logs', ['action' => 'digital_id.issued']);
    }

    public function test_repeated_approval_cannot_issue_a_second_id_or_change_status(): void
    {
        $application = $this->pending();
        $staff = $this->staff();

        $this->actingAs($staff)->postJson("/api/admin/applications/{$application->id}/approve")->assertOk();
        $first = DigitalId::first();

        $this->actingAs($staff)->postJson("/api/admin/applications/{$application->id}/approve")->assertStatus(409);
        $this->actingAs($staff)->postJson("/api/admin/applications/{$application->id}/reject", [
            'rejection_reason' => 'Changed my mind about this one.',
        ])->assertStatus(409);

        $this->assertSame(1, DigitalId::count());
        $this->assertSame($first->verification_token_hash, DigitalId::first()->verification_token_hash);
        $this->assertSame('approved', $application->fresh()->status->value);
    }

    public function test_rejection_requires_a_reason_the_student_can_see(): void
    {
        $application = $this->pending();
        $staff = $this->staff();

        $this->actingAs($staff)->postJson("/api/admin/applications/{$application->id}/reject", [])
            ->assertUnprocessable()->assertJsonValidationErrors('rejection_reason');

        $this->actingAs($staff)->postJson("/api/admin/applications/{$application->id}/reject", [
            'rejection_reason' => 'Photo is too dark to identify the student.',
            'review_notes' => 'Internal only',
        ])->assertOk();

        $this->assertSame('rejected', $application->fresh()->status->value);
        $this->assertDatabaseMissing('digital_ids', ['student_id' => $application->student_id]);
    }

    public function test_students_cannot_approve_or_reject_applications(): void
    {
        $application = $this->pending();
        $owner = $application->student->user;

        $this->actingAs($owner)->postJson("/api/admin/applications/{$application->id}/approve")->assertForbidden();
        $this->actingAs($owner)->postJson("/api/admin/applications/{$application->id}/reject", [
            'rejection_reason' => 'I would like to reject myself.',
        ])->assertForbidden();

        $this->assertSame('pending', $application->fresh()->status->value);
    }

    public function test_no_digital_id_is_available_before_approval(): void
    {
        $application = $this->pending();

        $this->actingAs($application->student->user)->getJson('/api/student/digital-id')
            ->assertOk()
            ->assertJsonPath('digital_id', null)
            ->assertJsonPath('status', 'pending')
            ->assertJsonMissingPath('verification_url');
    }

    public function test_student_receives_card_data_after_approval(): void
    {
        $student = $this->approvedStudent();

        $response = $this->actingAs($student->user)->getJson('/api/student/digital-id')->assertOk();

        $response->assertJsonPath('status', 'approved')
            ->assertJsonPath('student.student_number', $student->student_number);
        $this->assertStringContainsString('/verify/'.$this->tokenFor($student), $response->json('verification_url'));
    }

    public function test_registry_match_can_be_required_for_approval(): void
    {
        app(SettingsService::class)->setMany(['require_registry_match' => true]);
        $application = $this->pending(['student_number' => 'DEMO-2026-5000', 'first_name' => 'Ana', 'last_name' => 'Reyes']);
        $staff = $this->staff();

        $this->actingAs($staff)->postJson("/api/admin/applications/{$application->id}/approve")
            ->assertUnprocessable()->assertJsonValidationErrors('registry');

        EnrollmentRecord::create([
            'student_number' => 'DEMO-2026-5000', 'first_name' => 'Ana', 'last_name' => 'Reyes', 'program' => 'x',
        ]);

        $this->actingAs($staff)->getJson("/api/admin/applications/{$application->id}")
            ->assertJsonPath('registry_check.status', 'matched');
        $this->actingAs($staff)->postJson("/api/admin/applications/{$application->id}/approve")->assertOk();
    }

    public function test_application_queue_supports_filtering_and_search(): void
    {
        $this->pending(['first_name' => 'Zelda', 'last_name' => 'Findme']);
        $this->pending();
        $staff = $this->staff();

        $this->actingAs($staff)->getJson('/api/admin/applications?status=pending')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs($staff)->getJson('/api/admin/applications?status=pending&search=Findme')->assertJsonCount(1, 'data');
        $this->actingAs($staff)->getJson('/api/admin/applications?status=approved')->assertJsonCount(0, 'data');
    }
}
