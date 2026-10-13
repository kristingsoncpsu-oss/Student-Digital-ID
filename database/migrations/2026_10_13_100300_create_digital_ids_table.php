<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('digital_ids', function (Blueprint $table) {
            $table->id();
            // One digital ID per student: guarantees an approval can never issue a duplicate.
            $table->foreignId('student_id')->unique()->constrained()->cascadeOnDelete();
            $table->char('verification_token_hash', 64)->unique(); // sha256 of the QR token (lookup)
            $table->text('verification_token_encrypted');          // lets the owner re-render their QR
            $table->string('status', 20)->default('active');       // active | suspended | revoked
            $table->timestamp('issued_at');
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('status_reason')->nullable();
            $table->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('digital_ids');
    }
};
