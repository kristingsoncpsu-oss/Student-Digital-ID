<?php

namespace App\Http\Controllers\Auth;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        // Role is assigned here, server-side, and can never come from the request.
        $user = new User(['name' => $data['name'], 'email' => strtolower($data['email']), 'password' => $data['password']]);
        $user->role = Role::Student;
        $user->is_active = true;
        // Email verification is disabled for this school-project build.
        $user->email_verified_at = now();
        $user->save();

        Auth::login($user);
        $request->session()->regenerate();

        AuditLogger::record('user.registered', $user, actor: $user);

        return response()->json([
            'message' => 'Account created.',
            'user' => UserResource::make($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $user = User::where('email', strtolower($credentials['email']))->first();

        // Same message for unknown account, wrong password and deactivated account.
        if (! $user || ! Hash::check($credentials['password'], $user->password) || ! $user->is_active) {
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }

        Auth::login($user, (bool) ($credentials['remember'] ?? false));
        $request->session()->regenerate();

        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json(['user' => UserResource::make($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out.']);
    }

    public function user(Request $request): JsonResponse
    {
        if (! $request->user()->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            abort(403, 'This account has been deactivated.');
        }

        return response()->json(['user' => UserResource::make($request->user())]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', PasswordRule::defaults(), 'different:current_password'],
        ]);

        $request->user()->forceFill(['password' => $data['password']])->save();
        AuditLogger::record('user.password_changed', $request->user());

        return response()->json(['message' => 'Password updated.']);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        // Always the same response so the endpoint cannot be used to discover accounts.
        Password::sendResetLink($request->only('email'));

        return response()->json(['message' => 'If that email is registered, a password reset link has been sent.']);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill([
                'password' => $password,
                'remember_token' => Str::random(60),
            ])->save();

            // Receiving the reset link proves ownership of the inbox.
            if (! $user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }

            event(new PasswordReset($user));
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['email' => __($status)]);
        }

        return response()->json(['message' => 'Your password has been reset. You can now log in.']);
    }
}
