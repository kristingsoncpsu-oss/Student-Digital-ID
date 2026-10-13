<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function registerPayload(array $o = []): array
    {
        return array_merge([
            'name' => 'Maria Santos',
            'email' => 'maria@example.test',
            'password' => 'GoodPass#2026',
            'password_confirmation' => 'GoodPass#2026',
        ], $o);
    }

    public function test_student_can_register_and_receives_student_role(): void
    {
        Notification::fake();

        $this->postJson('/api/register', $this->registerPayload())
            ->assertCreated()
            ->assertJsonPath('user.role', 'student')
            ->assertJsonPath('user.email_verified', false);

        $user = User::where('email', 'maria@example.test')->firstOrFail();
        $this->assertSame(Role::Student, $user->role);
        $this->assertNotSame('GoodPass#2026', $user->password, 'password must be hashed');
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    public function test_public_registration_can_never_assign_a_privileged_role(): void
    {
        $this->postJson('/api/register', $this->registerPayload(['role' => 'admin', 'is_active' => true]))
            ->assertCreated();

        $this->assertSame(Role::Student, User::where('email', 'maria@example.test')->first()->role);
    }

    public function test_weak_passwords_are_rejected(): void
    {
        foreach (['short1A', 'alllowercase123', 'NoNumbersHereAtAll'] as $weak) {
            $this->postJson('/api/register', $this->registerPayload([
                'password' => $weak, 'password_confirmation' => $weak,
            ]))->assertUnprocessable()->assertJsonValidationErrors('password');
        }

        $this->postJson('/api/register', $this->registerPayload(['password_confirmation' => 'Different#2026']))
            ->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_duplicate_email_is_rejected(): void
    {
        User::factory()->create(['email' => 'maria@example.test']);

        $this->postJson('/api/register', $this->registerPayload())
            ->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_user_can_log_in_and_out(): void
    {
        User::factory()->create(['email' => 'a@example.test']);

        $this->postJson('/api/login', ['email' => 'a@example.test', 'password' => 'Password#12345'])
            ->assertOk()->assertJsonPath('user.email', 'a@example.test');

        $this->getJson('/api/user')->assertOk();
        $this->postJson('/api/logout')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_wrong_password_and_inactive_accounts_cannot_log_in(): void
    {
        User::factory()->create(['email' => 'a@example.test']);
        User::factory()->inactive()->create(['email' => 'off@example.test']);

        $this->postJson('/api/login', ['email' => 'a@example.test', 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->postJson('/api/login', ['email' => 'off@example.test', 'password' => 'Password#12345'])
            ->assertUnprocessable();
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => 'x@example.test', 'password' => 'nope'])->assertUnprocessable();
        }

        $this->postJson('/api/login', ['email' => 'x@example.test', 'password' => 'nope'])->assertStatus(429);
    }

    public function test_email_verification_link_verifies_the_account(): void
    {
        $user = User::factory()->unverified()->create();

        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), [
            'id' => $user->id, 'hash' => sha1($user->email),
        ]);

        $this->get($url)->assertRedirect('/verify-email?status=verified');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());

        // A tampered link is refused.
        $this->get('/email/verify/'.$user->id.'/'.sha1($user->email))->assertForbidden();
    }

    public function test_unverified_students_cannot_use_student_features(): void
    {
        $user = User::factory()->unverified()->create();

        $this->actingAs($user)->getJson('/api/student/dashboard')->assertForbidden();
        $this->actingAs($user)->postJson('/api/student/profile', $this->validProfile())->assertForbidden();
    }

    public function test_password_can_be_changed_and_reset(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->putJson('/api/user/password', [
            'current_password' => 'wrong', 'password' => 'NewPass#2026x', 'password_confirmation' => 'NewPass#2026x',
        ])->assertUnprocessable();

        $this->actingAs($user)->putJson('/api/user/password', [
            'current_password' => 'Password#12345', 'password' => 'NewPass#2026x', 'password_confirmation' => 'NewPass#2026x',
        ])->assertOk();

        $token = app('auth.password.broker')->createToken($user);
        $this->postJson('/api/reset-password', [
            'token' => $token, 'email' => $user->email,
            'password' => 'Another#2026xy', 'password_confirmation' => 'Another#2026xy',
        ])->assertOk();

        $this->assertTrue(\Hash::check('Another#2026xy', $user->fresh()->password));
    }

    public function test_forgot_password_does_not_reveal_whether_an_account_exists(): void
    {
        $this->postJson('/api/forgot-password', ['email' => 'nobody@example.test'])
            ->assertOk()->assertJsonPath('message', 'If that email is registered, a password reset link has been sent.');
    }
}
