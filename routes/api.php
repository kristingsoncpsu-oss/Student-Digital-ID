<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\Student;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/
Route::get('/public/settings', [PublicController::class, 'settings']);
Route::get('/verify/{token}', [PublicController::class, 'verify'])->middleware('throttle:verify');

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password-reset');
Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');

/*
|--------------------------------------------------------------------------
| Authenticated (Sanctum session cookie)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth:sanctum', 'throttle:api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1');

    // Private student photos (authorised per record by StudentPolicy).
    Route::get('/students/{id}/photo', [PhotoController::class, 'show'])->whereNumber('id');

    /*
    | Student portal. Always scoped to the logged-in user's own record; there is no
    | student id in any of these URLs.
    */
    Route::prefix('student')->middleware('role:student')->group(function () {
        Route::get('/dashboard', Student\DashboardController::class);
        Route::get('/profile', [Student\ProfileController::class, 'show']);
        Route::post('/profile', [Student\ProfileController::class, 'store']);
        // Multipart uploads need POST + _method=PUT from browsers; both are accepted.
        Route::match(['put', 'patch'], '/profile', [Student\ProfileController::class, 'update']);
        Route::get('/digital-id', Student\DigitalIdController::class);
        Route::get('/corrections', [Student\CorrectionRequestController::class, 'index']);
        Route::post('/corrections', [Student\CorrectionRequestController::class, 'store']);
    });

    /*
    | Registrar / staff and administrators.
    */
    Route::prefix('admin')->middleware('role:staff,admin')->group(function () {
        Route::get('/dashboard', Admin\DashboardController::class);

        Route::get('/students', [Admin\StudentController::class, 'index']);
        Route::post('/students', [Admin\StudentController::class, 'store']);
        Route::get('/students/{id}', [Admin\StudentController::class, 'show'])->whereNumber('id');
        Route::put('/students/{id}', [Admin\StudentController::class, 'update'])->whereNumber('id');
        Route::post('/students/{id}', [Admin\StudentController::class, 'update'])->whereNumber('id'); // multipart + _method=PUT
        Route::delete('/students/{id}', [Admin\StudentController::class, 'destroy'])->whereNumber('id');
        Route::post('/students/{id}/restore', [Admin\StudentController::class, 'restore'])->whereNumber('id');

        Route::get('/applications', [Admin\ApplicationController::class, 'index']);
        Route::get('/applications/{id}', [Admin\ApplicationController::class, 'show'])->whereNumber('id');
        Route::post('/applications/{id}/approve', [Admin\ApplicationController::class, 'approve'])->whereNumber('id');
        Route::post('/applications/{id}/reject', [Admin\ApplicationController::class, 'reject'])->whereNumber('id');

        Route::get('/corrections', [Admin\CorrectionRequestController::class, 'index']);
        Route::post('/corrections/{id}/approve', [Admin\CorrectionRequestController::class, 'approve'])->whereNumber('id');
        Route::post('/corrections/{id}/reject', [Admin\CorrectionRequestController::class, 'reject'])->whereNumber('id');

        Route::get('/digital-ids', [Admin\DigitalIdController::class, 'index']);
        Route::post('/digital-ids/{id}/suspend', [Admin\DigitalIdController::class, 'suspend'])->whereNumber('id');
        Route::post('/digital-ids/{id}/reactivate', [Admin\DigitalIdController::class, 'reactivate'])->whereNumber('id');
        Route::post('/digital-ids/{id}/revoke', [Admin\DigitalIdController::class, 'revoke'])->whereNumber('id');
        Route::post('/digital-ids/{id}/rotate', [Admin\DigitalIdController::class, 'rotate'])->whereNumber('id');

        Route::get('/audit-logs', [Admin\AuditLogController::class, 'index']);

        // Administrator-only.
        Route::middleware('role:admin')->group(function () {
            Route::get('/staff', [Admin\StaffController::class, 'index']);
            Route::post('/staff', [Admin\StaffController::class, 'store']);
            Route::put('/staff/{id}', [Admin\StaffController::class, 'update'])->whereNumber('id');

            Route::get('/settings', [Admin\SettingsController::class, 'show']);
            Route::put('/settings', [Admin\SettingsController::class, 'update']);
        });
    });
});
