<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();
            $table->string('visitor_name');
            $table->string('visitor_phone');
            $table->string('visitor_email')->nullable();
            $table->text('reason');
            $table->dateTime('preferred_at');
            $table->dateTime('scheduled_at')->nullable();
            $table->foreignId('assigned_staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('pending'); // pending, approved, rejected, rescheduled, completed, cancelled, no-show
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
