<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Authoritative list of enrolled students, used by staff to verify submissions.
        Schema::create('enrollment_registry', function (Blueprint $table) {
            $table->id();
            $table->string('student_number', 32)->unique();
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->string('program', 150);
            $table->unsignedTinyInteger('year_level')->nullable();
            $table->timestamps();

            $table->index('last_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_registry');
    }
};
