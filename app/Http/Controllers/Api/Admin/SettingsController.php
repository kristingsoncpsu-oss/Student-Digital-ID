<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function __construct(private SettingsService $settings)
    {
    }

    public function show(): JsonResponse
    {
        return response()->json(['settings' => $this->settings->all()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'institution_name' => ['required', 'string', 'max:150'],
            'institution_short' => ['required', 'string', 'max:30'],
            'department_name' => ['required', 'string', 'max:150'],
            'campus_note' => ['nullable', 'string', 'max:100'],
            'support_email' => ['nullable', 'email', 'max:150'],
            'support_phone' => ['nullable', 'string', 'max:40'],
            'id_validity_months' => ['nullable', 'integer', 'between:1,120'],
            'id_back_note' => ['nullable', 'string', 'max:300'],
            'collect_address' => ['required', 'boolean'],
            'require_registry_match' => ['required', 'boolean'],
            'verify_show_name' => ['required', 'boolean'],
            'verify_show_program' => ['required', 'boolean'],
            'verify_mask_number' => ['required', 'boolean'],
            'programs' => ['required', 'array', 'min:1', 'max:60'],
            'programs.*' => ['required', 'string', 'max:150', 'distinct'],
        ]);

        $this->settings->setMany($data);
        AuditLogger::record('settings.updated', 'settings', null, ['keys' => array_keys($data)]);

        return response()->json(['message' => 'Settings saved.', 'settings' => $this->settings->all()]);
    }
}
