<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicationAdministration extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'prescription_item_id',
        'administered_by',
        'scheduled_at',
        'administered_at',
        'status', // scheduled, given, missed, refused, cancelled
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'administered_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function prescriptionItem(): BelongsTo
    {
        return $this->belongsTo(PrescriptionItem::class);
    }

    public function administeringStaff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'administered_by');
    }
}
