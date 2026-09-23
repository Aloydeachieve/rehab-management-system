<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('medication_administrations', function (Blueprint $table) {
            $table->string('dose_slot')->nullable()->after('scheduled_at'); // morning, afternoon, evening, night
            $table->index(['patient_id', 'scheduled_at', 'dose_slot'], 'med_admin_patient_sched_slot_idx');
        });
    }

    public function down(): void
    {
        Schema::table('medication_administrations', function (Blueprint $table) {
            $table->dropIndex('med_admin_patient_sched_slot_idx');
            $table->dropColumn('dose_slot');
        });
    }
};
