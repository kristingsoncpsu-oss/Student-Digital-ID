<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_get_401_on_protected_endpoints(): void
    {
        foreach (['/api/user', '/api/student/dashboard', '/api/admin/dashboard', '/api/admin/students'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
    }

    public function test_students_cannot_reach_staff_endpoints(): void
    {
        $student = $this->student();

        foreach (['/api/admin/dashboard', '/api/admin/students', '/api/admin/applications', '/api/admin/audit-logs', '/api/admin/digital-ids'] as $url) {
            $this->actingAs($student->user)->getJson($url)->assertForbidden();
        }
    }

    public function test_staff_cannot_use_administrator_only_endpoints(): void
    {
        $staff = $this->staff();

        $this->actingAs($staff)->getJson('/api/admin/staff')->assertForbidden();
        $this->actingAs($staff)->getJson('/api/admin/settings')->assertForbidden();
        $this->actingAs($staff)->postJson('/api/admin/staff', [
            'name' => 'X', 'email' => 'x@example.test', 'role' => 'admin',
        ])->assertForbidden();
    }

    public function test_administrators_can_use_administrator_endpoints(): void
    {
        $this->actingAs($this->admin())->getJson('/api/admin/staff')->assertOk();
        $this->actingAs($this->admin())->getJson('/api/admin/settings')->assertOk();
    }

    public function test_staff_cannot_use_student_portal_endpoints(): void
    {
        $this->actingAs($this->staff())->getJson('/api/student/profile')->assertForbidden();
    }

    public function test_deactivated_staff_lose_access_immediately(): void
    {
        $staff = $this->staff();
        $staff->forceFill(['is_active' => false])->save();

        $this->actingAs($staff)->getJson('/api/admin/students')->assertForbidden();
    }

    public function test_student_cannot_read_another_students_record_or_photo(): void
    {
        Storage::fake('local');
        $mine = $this->student();
        $other = $this->student();
        $other->photo_path = $this->fakePhoto('p.png')->store('student-photos', 'local');
        $other->save();

        // Staff-only record endpoint.
        $this->actingAs($mine->user)->getJson('/api/admin/students/'.$other->id)->assertForbidden();

        // Photo endpoint is authorised per record.
        $this->actingAs($mine->user)->get('/api/students/'.$other->id.'/photo')->assertForbidden();

        // Own photo and staff access work.
        $this->actingAs($other->user)->get('/api/students/'.$other->id.'/photo')->assertOk();
        $this->actingAs($this->staff())->get('/api/students/'.$other->id.'/photo')->assertOk();
    }

    public function test_student_profile_endpoint_ignores_client_supplied_ids(): void
    {
        $mine = $this->student(attrs: ['first_name' => 'Mine']);
        $other = $this->student(attrs: ['first_name' => 'Other']);

        $this->actingAs($mine->user)
            ->getJson('/api/student/profile?student_id='.$other->id.'&user_id='.$other->user_id)
            ->assertOk()
            ->assertJsonPath('student.first_name', 'Mine');

        $this->actingAs($mine->user)->putJson('/api/student/profile', [
            'id' => $other->id, 'student_id' => $other->id, 'user_id' => $other->user_id,
            'first_name' => 'Hacked', 'last_name' => $mine->last_name, 'student_number' => $mine->student_number,
            'school_email' => $mine->school_email, 'contact_number' => '09170000000',
            'program' => $mine->program, 'year_level' => $mine->year_level,
        ])->assertOk();

        $this->assertSame('Other', $other->fresh()->first_name);
    }
}
