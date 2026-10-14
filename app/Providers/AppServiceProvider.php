<?php

namespace App\Providers;

use App\Services\SettingsService;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(SettingsService::class);
    }

    public function boot(): void
    {
        Password::defaults(function () {
            return Password::min(10)->mixedCase()->numbers();
        });

        VerifyEmail::createUrlUsing(function ($notifiable) {
            return URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes((int) config('auth.verification.expire', 60)),
                ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())]
            );
        });

        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            return url('/reset-password').'?'.http_build_query([
                'token' => $token,
                'email' => $notifiable->getEmailForReset(),
            ]);
        });

        RateLimiter::for('login', fn (Request $r) => [
            Limit::perMinute(10)->by($r->ip()),
            Limit::perMinute(5)->by(strtolower((string) $r->input('email')).'|'.$r->ip()),
        ]);
        RateLimiter::for('register', fn (Request $r) => Limit::perMinute(6)->by($r->ip()));
        RateLimiter::for('password-reset', fn (Request $r) => Limit::perMinute(5)->by($r->ip()));
        RateLimiter::for('verify', fn (Request $r) => Limit::perMinute(30)->by($r->ip()));
        RateLimiter::for('api', fn (Request $r) => Limit::perMinute(240)->by($r->user()?->id ?: $r->ip()));
    }
}
