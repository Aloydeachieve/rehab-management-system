<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. medical_histories
        Schema::create('medical_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });

        // 2. assessments
        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('treatment_session_id')->nullable();
            $table->foreignId('practitioner_id')->constrained('users')->cascadeOnDelete();
            $table->string('assessment_type');
            $table->text('findings');
            $table->text('recommendation');
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });

        // 3. vital_signs
        Schema::create('vital_signs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->decimal('temperature', 4, 1)->nullable(); // e.g. 37.5
            $table->integer('pulse')->nullable();
            $table->string('blood_pressure')->nullable(); // e.g. 120/80
            $table->integer('respiratory_rate')->nullable();
            $table->decimal('weight', 5, 2)->nullable(); // e.g. 70.25
            $table->text('notes')->nullable();
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });

        // 4. clinical_notes
        Schema::create('clinical_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('practitioner_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('treatment_session_id')->nullable();
            $table->string('note_type'); // e.g. intake, progress, clinical
            $table->text('content');
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });

        // 5. prescriptions
        Schema::create('prescriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('practitioner_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('treatment_session_id')->nullable();
            $table->string('status')->default('active'); // active, inactive, completed
            $table->text('notes')->nullable();
            $table->timestamp('prescribed_at')->useCurrent();
            $table->timestamps();
        });

        // 6. prescription_items
        Schema::create('prescription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained()->cascadeOnDelete();
            $table->string('medication_name');
            $table->string('dosage');
            $table->string('frequency');
            $table->string('duration');
            $table->text('instructions')->nullable();
            $table->timestamps();
        });

        // 7. treatment_plans
        Schema::create('treatment_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('practitioner_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('treatment_session_id')->nullable();
            $table->text('goals');
            $table->text('plan');
            $table->date('review_date')->nullable();
            $table->string('status')->default('active'); // active, completed, modified
            $table->timestamps();
        });

        // 8. progress_notes
        Schema::create('progress_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('practitioner_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('treatment_session_id')->nullable();
            $table->text('content');
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progress_notes');
        Schema::dropIfExists('treatment_plans');
        Schema::dropIfExists('prescription_items');
        Schema::dropIfExists('prescriptions');
        Schema::dropIfExists('clinical_notes');
        Schema::dropIfExists('vital_signs');
        Schema::dropIfExists('assessments');
        Schema::dropIfExists('medical_histories');
    }
};
