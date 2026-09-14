<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('treatment_sessions', function (Blueprint $table) {
            $table->decimal('session_price', 12, 2)->nullable()->after('session_number');
        });
    }

    public function down(): void
    {
        Schema::table('treatment_sessions', function (Blueprint $table) {
            $table->dropColumn('session_price');
        });
    }
};
