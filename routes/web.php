<?php

use App\Http\Controllers\Auth\EmailVerificationController;
use Illuminate\Support\Facades\Route;

// Signed email-verification link target (opened from the user's inbox, possibly logged out).
Route::get('/email/verify/{id}/{hash}', [EmailVerificationController::class, 'verify'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

// Everything else is handled by the React Router SPA.
Route::view('/{any?}', 'spa')->where('any', '^(?!api|sanctum|storage|up|build|images).*$')->name('spa');
