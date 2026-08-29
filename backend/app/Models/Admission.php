<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Admission extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'admission_date',
        'admission_type',
        'admitted_by',
        'status',
        'notes',
    ];

    protected $casts = [
        'admission_date' => 'date',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function admittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admitted_by');
    }
}
