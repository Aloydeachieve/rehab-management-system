<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->boolean('is_verified')->default(false)->after('is_primary');
        });

        // For any existing guardian accounts that already had a password set and were linked, mark them verified
        DB::table('guardians')
            ->whereNotNull('password')
            ->whereNotNull('patient_id')
            ->update(['is_verified' => true]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('guardians', function (Blueprint $table) {
            $table->dropColumn('is_verified');
        });
    }
};
