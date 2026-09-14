<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TreatmentPricingConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'initial_session_price',
        'subsequent_session_price',
        'currency',
        'session_duration_days',
        'updated_by',
    ];

    protected $casts = [
        'initial_session_price' => 'decimal:2',
        'subsequent_session_price' => 'decimal:2',
        'session_duration_days' => 'integer',
    ];

    public function updatedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
