<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Demo data is FICTIONAL and must never be seeded into a real deployment.
        if (app()->isProduction() && ! env('ALLOW_DEMO_SEED', false)) {
            $this->command?->warn('Skipping demo data in production. Create the first administrator with: php artisan app:create-admin');

            return;
        }

        $this->call(DemoDataSeeder::class);
    }
}
