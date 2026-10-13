<?php

namespace Tests\Feature;

use App\Models\DigitalId;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class StudentRecordsTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_create_a_student_record_with_an_account(): void
    {
        Notification::fake();
        $staff = $this->staff();

        $this->actingAs($staff)->postJson('/api/admin/students', $this->validProfile())
            ->assertCreated()
            ->assertJsonPath('student.student_number', 'DEMO-2026-9001')
            ->assertJsonPath('student.portal_status', 'pending');

        $student = Student::where('student_number', 'DEMO-2026-9001')->firstOrFail();
        $this->assertSame($staff->id, $student->created_by);
        $this->assertSame('student', $student->user->role->value);
        $this->assertDatabaseHas('audit_logs', ['action' => 'student.created', 'actor_user_id' => $staff->id]);
    }

    public function test_create_validates_and_enforces_unique_student_number(): void
    {
        $staff = $this->staff();
        $this->student(attrs: ['student_number' => 'DEMO-2026-9001']);

        $this->actingAs($staff)->postJson('/api/admin/students', $this->validProfile())
            ->assertUnprocessable()->assertJsonValidationErrors('student_number');
        $this->actingAs($staff)->postJson('/api/admin/students', [])->assertUnprocessable();
        $this->actingAs($staff)->postJson('/api/admin/students', $this->validProfile([
            'student_number' => 'NEW-0001', 'program' => 'Not a real program',
        ]))->assertUnprocessable()->assertJsonValidationErrors('program');
    }

    public function test_staff_can_update_a_record_and_changes_are_audited(): void
    {
        $student = $this->student(attrs: ['year_level' => 1]);
        $staff = $this->staff();

        $this->actingAs($staff)->putJson('/api/admin/students/'.$student->id, $this->validProfile([
            'student_number' => $student->student_number,
            'school_email' => $student->school_email,
            'year_level' => 4,
            'enrollment_status' => 'graduated',
        ]))->assertOk();

        $student->refresh();
        $this->assertSame(4, $student->year_level);
        $this->assertSame('graduated', $student->enrollment_status->value);
        $log = \App\Models\AuditLog::where('action', 'student.updated')->latest('id')->first();
        $this->assertContains('year_level', $log->metadata['changed_fields']);
    }

    public function test_delete_archives_instead_of_destroying(): void
    {
        $student = $this->approvedStudent();
        $staff = $this->staff();

        $this->actingAs($staff)->deleteJson('/api/admin/students/'.$student->id, ['reason' => 'Duplicate record'])->assertOk();

        $this->assertSoftDeleted('students', ['id' => $student->id]);
        $this->assertSame(1, Student::withTrashed()->where('id', $student->id)->count());
        $this->assertSame(1, DigitalId::count());
        $this->assertDatabaseHas('audit_logs', ['action' => 'student.archived', 'target_id' => $student->id]);

        // Hidden from the default directory, visible when asked for.
        $this->actingAs($staff)->getJson('/api/admin/students')->assertJsonCount(0, 'data');
        $this->actingAs($staff)->getJson('/api/admin/students?archived=only')->assertJsonCount(1, 'data');
    }

    public function test_only_administrators_can_restore_archived_records(): void
    {
        $student = $this->student();
        $student->delete();

        $this->actingAs($this->staff())->postJson("/api/admin/students/{$student->id}/restore")->assertForbidden();
        $this->actingAs($this->admin())->postJson("/api/admin/students/{$student->id}/restore")->assertOk();
        $this->assertNull($student->fresh()->deleted_at);
    }

    public function test_directory_search_filters_sorting_and_pagination(): void
    {
        $staff = $this->staff();
        $this->student(attrs: ['first_name' => 'Alpha', 'last_name' => 'Zed', 'student_number' => 'S-100001', 'year_level' => 1, 'program' => 'Bachelor of Science in Computer Science']);
        $this->student(attrs: ['first_name' => 'Beta', 'last_name' => 'Yan', 'student_number' => 'S-100002', 'year_level' => 2]);
        $this->student(attrs: ['first_name' => 'Gamma', 'last_name' => 'Xu', 'student_number' => 'S-100003', 'year_level' => 2, 'enrollment_status' => 'graduated']);

        $this->actingAs($staff)->getJson('/api/admin/students?search=S-100002')->assertJsonCount(1, 'data')->assertJsonPath('data.0.first_name', 'Beta');
        $this->actingAs($staff)->getJson('/api/admin/students?search=gamma')->assertJsonCount(1, 'data');
        $this->actingAs($staff)->getJson('/api/admin/students?year_level=2')->assertJsonCount(2, 'data');
        $this->actingAs($staff)->getJson('/api/admin/students?program='.urlencode('Bachelor of Science in Computer Science'))->assertJsonCount(1, 'data');
        $this->actingAs($staff)->getJson('/api/admin/students?enrollment_status=graduated')->assertJsonCount(1, 'data');
        $this->actingAs($staff)->getJson('/api/admin/students?sort=last_name&dir=asc')->assertJsonPath('data.0.last_name', 'Xu');
        $this->actingAs($staff)->getJson('/api/admin/students?per_page=5&search=S-1000')->assertJsonPath('meta.total', 3);
        // A LIKE wildcard typed by the user must not match everything.
        $this->actingAs($staff)->getJson('/api/admin/students?search=%25')->assertJsonCount(0, 'data');
    }

    public function test_id_status_filter(): void
    {
        $staff = $this->staff();
        $approved = $this->approvedStudent();
        $this->pending();
        $suspended = $this->approvedStudent();
        $this->actingAs($staff)->postJson('/api/admin/digital-ids/'.$suspended->digitalId->id.'/suspend', ['reason' => 'Testing'])->assertOk();

        $this->actingAs($staff)->getJson('/api/admin/students?id_status=approved')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $approved->id);
        $this->actingAs($staff)->getJson('/api/admin/students?id_status=pending')->assertJsonCount(1, 'data');
        $this->actingAs($staff)->getJson('/api/admin/students?id_status=suspended')->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $suspended->id);
    }

    public function test_admin_manages_staff_accounts_and_cannot_lock_themselves_out(): void
    {
        Notification::fake();
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/admin/staff', [
            'name' => 'New Registrar', 'email' => 'new.registrar@example.test', 'role' => 'staff',
        ])->assertCreated();
        $created = User::where('email', 'new.registrar@example.test')->firstOrFail();
        $this->assertSame('staff', $created->role->value);

        $this->actingAs($admin)->putJson('/api/admin/staff/'.$created->id, ['is_active' => false])->assertOk();
        $this->assertFalse($created->fresh()->is_active);

        $this->actingAs($admin)->putJson('/api/admin/staff/'.$admin->id, ['role' => 'staff'])->assertUnprocessable();
        $this->actingAs($admin)->putJson('/api/admin/staff/'.$admin->id, ['is_active' => false])->assertUnprocessable();

        // Student accounts are not manageable through this endpoint.
        $studentUser = User::factory()->create();
        $this->actingAs($admin)->putJson('/api/admin/staff/'.$studentUser->id, ['role' => 'admin'])->assertNotFound();
    }

    public function test_settings_can_be_updated_by_admin_and_drive_the_public_branding(): void
    {
        $admin = $this->admin();
        $payload = [
            'institution_name' => 'Test University', 'institution_short' => 'TU', 'department_name' => 'Dept of Tests',
            'campus_note' => '', 'support_email' => 'help@example.test', 'support_phone' => '',
            'id_validity_months' => 12, 'id_back_note' => 'Return if found.',
            'collect_address' => false, 'require_registry_match' => false,
            'verify_show_name' => true, 'verify_show_program' => true, 'verify_mask_number' => true,
            'programs' => ['BS Testing', 'BS Quality'],
        ];

        $this->actingAs($admin)->putJson('/api/admin/settings', $payload)->assertOk();
        $this->getJson('/api/public/settings')
            ->assertJsonPath('settings.institution_name', 'Test University')
            ->assertJsonPath('settings.programs.1', 'BS Quality')
            ->assertJsonMissingPath('settings.require_registry_match');

        $this->actingAs($admin)->putJson('/api/admin/settings', [...$payload, 'programs' => ['A', 'A']])->assertUnprocessable();
        $this->assertDatabaseHas('audit_logs', ['action' => 'settings.updated']);
    }

    public function test_audit_log_visibility_depends_on_role(): void
    {
        $admin = $this->admin();
        $staff = $this->staff();
        $this->actingAs($admin)->putJson('/api/admin/staff/'.$staff->id, ['name' => 'Renamed'])->assertOk();
        $this->approvedStudent();

        $adminActions = collect($this->actingAs($admin)->getJson('/api/admin/audit-logs?per_page=100')->json('data'))->pluck('action');
        $staffActions = collect($this->actingAs($staff)->getJson('/api/admin/audit-logs?per_page=100')->json('data'))->pluck('action');

        $this->assertTrue($adminActions->contains('staff.updated'));
        $this->assertFalse($staffActions->contains('staff.updated'));
        $this->assertTrue($staffActions->contains('application.approved'));
    }
}
