<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create treatment_sessions table
        Schema::create('treatment_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->integer('session_number');
            $table->date('start_date');
            $table->date('expected_end_date');
            $table->date('actual_end_date')->nullable();
            $table->string('status')->default('active'); // active, completed, discharged, cancelled
            $table->foreignId('professional_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('recommendation')->nullable(); // continue, discharge
            $table->text('notes')->nullable();
            $table->string('payment_status')->default('unpaid'); // unpaid, paid, partially_paid
            $table->foreignId('reassessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reassessed_at')->nullable();
            $table->foreignId('decision_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decision_at')->nullable();
            $table->timestamps();

            // Prevent duplicate session numbers for the same patient
            $table->unique(['patient_id', 'session_number']);
        });

        // 2. Add foreign keys to Phase 4 clinical tables
        Schema::table('assessments', function (Blueprint $table) {
            $table->foreign('treatment_session_id')->references('id')->on('treatment_sessions')->nullOnDelete();
        });

        Schema::table('clinical_notes', function (Blueprint $table) {
            $table->foreign('treatment_session_id')->references('id')->on('treatment_sessions')->nullOnDelete();
        });

        Schema::table('prescriptions', function (Blueprint $table) {
            $table->foreign('treatment_session_id')->references('id')->on('treatment_sessions')->nullOnDelete();
        });

        Schema::table('treatment_plans', function (Blueprint $table) {
            $table->foreign('treatment_session_id')->references('id')->on('treatment_sessions')->nullOnDelete();
        });

        Schema::table('progress_notes', function (Blueprint $table) {
            $table->foreign('treatment_session_id')->references('id')->on('treatment_sessions')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Remove foreign keys from Phase 4 tables first
        Schema::table('progress_notes', function (Blueprint $table) {
            $table->dropForeign(['treatment_session_id']);
        });

        Schema::table('treatment_plans', function (Blueprint $table) {
            $table->dropForeign(['treatment_session_id']);
        });

        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropForeign(['treatment_session_id']);
        });

        Schema::table('clinical_notes', function (Blueprint $table) {
            $table->dropForeign(['treatment_session_id']);
        });

        Schema::table('assessments', function (Blueprint $table) {
            $table->dropForeign(['treatment_session_id']);
        });

        // Drop treatment_sessions
        Schema::dropIfExists('treatment_sessions');
    }
};
