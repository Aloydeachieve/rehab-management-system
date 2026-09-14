<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('treatment_pricing_configs', function (Blueprint $table) {
            $table->id();
            $table->decimal('initial_session_price', 12, 2)->default(300000.00);
            $table->decimal('subsequent_session_price', 12, 2)->default(200000.00);
            $table->string('currency', 10)->default('NGN');
            $table->unsignedInteger('session_duration_days')->default(30);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('treatment_pricing_configs');
    }
};
