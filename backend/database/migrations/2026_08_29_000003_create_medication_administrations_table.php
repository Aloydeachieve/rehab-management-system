<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('medication_administrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prescription_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('administered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('scheduled_at');
            $table->dateTime('administered_at')->nullable();
            $table->string('status')->default('scheduled'); // scheduled, given, missed, refused, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes for quick schedule lookups
            $table->index(['patient_id', 'scheduled_at']);
            $table->index(['status', 'scheduled_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('medication_administrations');
    }
};
