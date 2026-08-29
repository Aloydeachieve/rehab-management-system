<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TreatmentSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'session_number',
        'start_date',
        'expected_end_date',
        'actual_end_date',
        'status', // active, completed, discharged, cancelled
        'professional_id',
        'recommendation', // continue, discharge
        'notes',
        'payment_status', // unpaid, paid, partially_paid
        'reassessed_by',
        'reassessed_at',
        'decision_by',
        'decision_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'expected_end_date' => 'date',
        'actual_end_date' => 'date',
        'reassessed_at' => 'datetime',
        'decision_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function professional(): BelongsTo
    {
        return $this->belongsTo(User::class, 'professional_id');
    }

    public function reassessedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reassessed_by');
    }

    public function decisionByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decision_by');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }

    public function clinicalNotes(): HasMany
    {
        return $this->hasMany(ClinicalNote::class);
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class);
    }

    public function treatmentPlans(): HasMany
    {
        return $this->hasMany(TreatmentPlan::class);
    }

    public function progressNotes(): HasMany
    {
        return $this->hasMany(ProgressNote::class);
    }
}
