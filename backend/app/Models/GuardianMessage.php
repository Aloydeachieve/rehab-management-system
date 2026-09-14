<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GuardianMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'guardian_id',
        'sender_user_id',
        'message',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class);
    }

    public function senderUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function isFromGuardian(): bool
    {
        return $this->sender_user_id === null;
    }

    public function isFromStaff(): bool
    {
        return $this->sender_user_id !== null;
    }
}
