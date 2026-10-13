<?php

namespace Tests\Feature;

use App\Models\DigitalId;
use App\Services\DigitalIdService;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_id_reveals_only_the_minimum_information(): void
    {
        $student = $this->approvedStudent([
            'student_number' => 'DEMO-2026-1234', 'contact_number' => '09175550000', 'address' => 'Secret Street 1',
        ]);

        $response = $this->getJson('/api/verify/'.$this->tokenFor($student))
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('status', 'active')
            ->assertJsonPath('student.name', $student->full_name)
            ->assertJsonPath('student.student_number', '••••••••••1234'); // masked

        $body = json_encode($response->json());
        foreach (['09175550000', 'Secret Street', $student->school_email, 'DEMO-2026-1234', '"id"', '"user_id"'] as $leak) {
            $this->assertStringNotContainsString($leak, $body, "response leaked {$leak}");
        }
        $this->assertArrayNotHasKey('photo_url', $response->json('student'));
    }

    public function test_privacy_settings_control_what_is_revealed(): void
    {
        app(SettingsService::class)->setMany([
            'verify_show_name' => false, 'verify_show_program' => false, 'verify_mask_number' => false,
        ]);
        $student = $this->approvedStudent(['student_number' => 'DEMO-2026-4321']);

        $this->getJson('/api/verify/'.$this->tokenFor($student))
            ->assertJsonPath('valid', true)
            ->assertJsonPath('student.name', null)
            ->assertJsonPath('student.program', null)
            ->assertJsonPath('student.student_number', 'DEMO-2026-4321');
    }

    public function test_unknown_or_malformed_tokens_are_invalid(): void
    {
        $this->getJson('/api/verify/'.str_repeat('a', 48))->assertOk()->assertJsonPath('valid', false)->assertJsonPath('status', 'unknown');
        $this->getJson('/api/verify/1')->assertOk()->assertJsonPath('valid', false);
        $this->getJson('/api/verify/'.str_repeat('a', 48))->assertJsonMissingPath('student');
    }

    public function test_suspended_id_stops_verifying_immediately_and_recovers_when_reactivated(): void
    {
        $student = $this->approvedStudent();
        $token = $this->tokenFor($student);
        $id = DigitalId::first();
        $staff = $this->staff();

        $this->getJson("/api/verify/{$token}")->assertJsonPath('valid', true);

        $this->actingAs($staff)->postJson("/api/admin/digital-ids/{$id->id}/suspend", ['reason' => 'Pending clearance'])->assertOk();
        $this->getJson("/api/verify/{$token}")
            ->assertJsonPath('valid', false)->assertJsonPath('status', 'suspended')->assertJsonMissingPath('student');

        $this->actingAs($staff)->postJson("/api/admin/digital-ids/{$id->id}/reactivate")->assertOk();
        $this->getJson("/api/verify/{$token}")->assertJsonPath('valid', true);
    }

    public function test_revoked_id_never_verifies_and_cannot_be_reactivated(): void
    {
        $student = $this->approvedStudent();
        $token = $this->tokenFor($student);
        $id = DigitalId::first();
        $staff = $this->staff();

        $this->actingAs($staff)->postJson("/api/admin/digital-ids/{$id->id}/revoke", ['reason' => 'Left the university'])->assertOk();

        $this->getJson("/api/verify/{$token}")->assertJsonPath('valid', false)->assertJsonPath('status', 'revoked');
        $this->actingAs($staff)->postJson("/api/admin/digital-ids/{$id->id}/reactivate")->assertStatus(409);
    }

    public function test_suspension_requires_a_reason(): void
    {
        $this->approvedStudent();

        $this->actingAs($this->staff())->postJson('/api/admin/digital-ids/'.DigitalId::first()->id.'/suspend', [])
            ->assertUnprocessable()->assertJsonValidationErrors('reason');
    }

    public function test_expired_id_is_invalid(): void
    {
        $student = $this->approvedStudent();
        DigitalId::first()->forceFill(['expires_at' => now()->subDay()])->save();

        $this->getJson('/api/verify/'.$this->tokenFor($student))
            ->assertJsonPath('valid', false)->assertJsonPath('status', 'expired');
    }

    public function test_validity_period_comes_from_settings(): void
    {
        app(SettingsService::class)->setMany(['id_validity_months' => 12]);
        $this->approvedStudent();

        $this->assertEqualsWithDelta(now()->addMonths(12)->timestamp, DigitalId::first()->expires_at->timestamp, 60);
    }

    public function test_archived_student_no_longer_verifies(): void
    {
        $student = $this->approvedStudent();
        $token = $this->tokenFor($student);

        $this->actingAs($this->staff())->deleteJson('/api/admin/students/'.$student->id, ['reason' => 'Transferred'])->assertOk();

        $this->getJson("/api/verify/{$token}")->assertJsonPath('valid', false)->assertJsonMissingPath('student');
    }

    public function test_rotating_the_token_invalidates_the_old_qr(): void
    {
        $student = $this->approvedStudent();
        $old = $this->tokenFor($student);

        $this->actingAs($this->staff())->postJson('/api/admin/digital-ids/'.DigitalId::first()->id.'/rotate')->assertOk();
        $new = $this->tokenFor($student);

        $this->assertNotSame($old, $new);
        $this->getJson("/api/verify/{$old}")->assertJsonPath('valid', false);
        $this->getJson("/api/verify/{$new}")->assertJsonPath('valid', true);
    }

    public function test_token_is_random_and_not_stored_in_plaintext(): void
    {
        $student = $this->approvedStudent();
        $token = $this->tokenFor($student);
        $row = \DB::table('digital_ids')->first();

        $this->assertSame(48, strlen($token));
        $this->assertSame(hash('sha256', $token), $row->verification_token_hash);
        $this->assertStringNotContainsString($token, json_encode($row));
        $this->assertDoesNotMatchRegularExpression('/^\d+$/', $token, 'token must not be a sequential id');
    }

    public function test_verify_endpoint_is_throttled(): void
    {
        for ($i = 0; $i < 30; $i++) {
            $this->getJson('/api/verify/'.str_repeat('b', 48))->assertOk();
        }
        $this->getJson('/api/verify/'.str_repeat('b', 48))->assertStatus(429);
    }

    public function test_service_reactivate_only_works_on_suspended_ids(): void
    {
        $this->approvedStudent();

        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);
        app(DigitalIdService::class)->reactivate(DigitalId::first(), $this->staff());
    }
}
