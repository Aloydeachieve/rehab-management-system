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
        'is_verified',
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
        'is_verified' => 'boolean',
        'last_login_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Guardian $guardian) {
            if (!isset($guardian->attributes['is_verified'])) {
                // If is_verified is not explicitly set:
                // If password is provided upon creation (e.g. test fixture/pre-activated), default to true.
                // If password is null (e.g. internal intake candidate created at reception), default to false.
                $guardian->is_verified = !empty($guardian->password);
            }
        });
    }

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
        if (!$this->is_verified) {
            return new Collection();
        }

        $patientIds = self::where('email', $this->email)
            ->whereNotNull('email')
            ->where('is_verified', true)
            ->whereNotNull('patient_id')
            ->pluck('patient_id');

        if ($this->patient_id) {
            $patientIds->push($this->patient_id);
        }

        $validIds = $patientIds->unique()->filter()->values()->all();

        if (empty($validIds)) {
            return new Collection();
        }

        return Patient::whereIn('id', $validIds)->get();
    }

    /**
     * Determine if the guardian has at least one verified associated/linked patient for portal access.
     */
    public function isLinked(): bool
    {
        if (!$this->is_verified) {
            return false;
        }

        return (!empty($this->patient_id) || $this->accessiblePatients()->isNotEmpty());
    }
}
