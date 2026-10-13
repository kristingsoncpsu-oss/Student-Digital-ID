<?php

namespace App\Services;

use App\Models\Setting;

/**
 * Institution branding and ID policy. Values live in the `settings` table
 * (JSON-encoded) and fall back to config('digitalid.defaults').
 */
class SettingsService
{
    private ?array $cache = null;

    public function all(): array
    {
        if ($this->cache === null) {
            $stored = Setting::query()->pluck('value', 'key')
                ->map(fn ($v) => json_decode($v, true))
                ->all();

            $this->cache = array_merge(config('digitalid.defaults'), $stored);
        }

        return $this->cache;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->all()[$key] ?? $default;
    }

    public function setMany(array $values): void
    {
        $allowed = array_keys(config('digitalid.defaults'));

        foreach ($values as $key => $value) {
            if (! in_array($key, $allowed, true)) {
                continue;
            }
            Setting::updateOrCreate(['key' => $key], ['value' => json_encode($value)]);
        }

        $this->cache = null;
    }

    /** Branding + policy values that are safe to show to anyone (landing page, login, verify page). */
    public function public(): array
    {
        $s = $this->all();

        return [
            'institution_name' => $s['institution_name'],
            'institution_short' => $s['institution_short'],
            'department_name' => $s['department_name'],
            'campus_note' => $s['campus_note'],
            'support_email' => $s['support_email'],
            'support_phone' => $s['support_phone'],
            'id_back_note' => $s['id_back_note'],
            'collect_address' => (bool) $s['collect_address'],
            'programs' => array_values($s['programs'] ?? []),
            'logos' => config('digitalid.logos'),
        ];
    }

    public function forget(): void
    {
        $this->cache = null;
    }
}
