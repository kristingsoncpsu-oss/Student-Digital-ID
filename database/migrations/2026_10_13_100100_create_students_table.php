<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            // Nullable so staff can pre-register a record; unique so an account owns at most one record.
            $table->foreignId('user_id')->nullable()->unique()->constrained()->nullOnDelete();
            $table->string('student_number', 32)->unique();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('suffix', 20)->nullable();
            $table->string('school_email')->unique();
            $table->string('contact_number', 30);
            $table->string('program', 150);
            $table->unsignedTinyInteger('year_level');
            $table->string('photo_path')->nullable();
            $table->string('enrollment_status', 20)->default('enrolled');
            $table->string('address')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes(); // archive, never hard delete from the UI
            $table->timestamps();

            $table->index('last_name');
            $table->index('program');
            $table->index('year_level');
            $table->index('enrollment_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
