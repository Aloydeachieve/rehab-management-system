<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VitalSign extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'recorded_by',
        'temperature',
        'pulse',
        'blood_pressure',
        'respiratory_rate',
        'weight',
        'notes',
        'recorded_at',
    ];

    protected $casts = [
        'temperature' => 'float',
        'pulse' => 'integer',
        'respiratory_rate' => 'integer',
        'weight' => 'float',
        'recorded_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
