<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Guardian extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'patient_id',
        'name',
        'relationship',
        'phone',
        'email',
        'password',
        'address',
        'is_primary',
        'status',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
        'is_primary' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(GuardianMessage::class);
    }

    /**
     * Retrieve all patients linked to this guardian email/record.
     */
    public function accessiblePatients(): Collection
    {
        $patientIds = self::where('email', $this->email)
            ->whereNotNull('email')
            ->pluck('patient_id')
            ->push($this->patient_id)
            ->unique()
            ->filter();

        return Patient::whereIn('id', $patientIds)->get();
    }
}
