<?php

namespace Tests\Feature;

use App\Models\DigitalId;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_metrics_are_empty_on_a_fresh_install(): void
    {
        $this->actingAs($this->admin())->getJson('/api/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('totals.pending', 0)
            ->assertJsonPath('totals.approved', 0)
            ->assertJsonPath('totals.student_records', 0)
            ->assertJsonCount(30, 'registrations');
    }

    public function test_metrics_reflect_the_database(): void
    {
        $staff = $this->staff();

        $this->approvedStudent();
        $this->approvedStudent();
        $this->pending();
        $this->pending();
        $this->pending();

        $rejected = $this->pending();
        $this->actingAs($staff)->postJson("/api/admin/applications/{$rejected->id}/reject", [
            'rejection_reason' => 'Information could not be verified.',
        ])->assertOk();

        $suspended = $this->approvedStudent();
        $this->actingAs($staff)->postJson('/api/admin/digital-ids/'.DigitalId::where('student_id', $suspended->id)->first()->id.'/suspend', [
            'reason' => 'Testing suspension',
        ])->assertOk();

        User::factory()->create(); // student account with no submission yet

        $response = $this->actingAs($staff)->getJson('/api/admin/dashboard')->assertOk();

        $response->assertJsonPath('totals.student_records', 7)
            ->assertJsonPath('totals.pending', 3)
            ->assertJsonPath('totals.approved', 2)
            ->assertJsonPath('totals.rejected', 1)
            ->assertJsonPath('totals.suspended', 1);

        $distribution = collect($response->json('status_distribution'))->pluck('value', 'key');
        $this->assertSame(1, $distribution['incomplete']);
        $this->assertSame(3, $distribution['pending']);

        $this->assertCount(6, $response->json('recent_registrations'));
        // 7 student accounts with records + 1 without; staff accounts are not counted.
        $this->assertSame(8, collect($response->json('registrations'))->sum('count'));
    }

    public function test_student_dashboard_shows_only_own_data(): void
    {
        $student = $this->approvedStudent();
        $this->pending(); // someone else

        $this->actingAs($student->user)->getJson('/api/student/dashboard')
            ->assertOk()
            ->assertJsonPath('status', 'approved')
            ->assertJsonPath('student.student_number', $student->student_number)
            ->assertJsonPath('completion', 88);
    }

    public function test_new_student_dashboard_is_incomplete(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/student/dashboard')
            ->assertOk()->assertJsonPath('status', 'incomplete')->assertJsonPath('student', null)->assertJsonPath('completion', 0);
    }
}
