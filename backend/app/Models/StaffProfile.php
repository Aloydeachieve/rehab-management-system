<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StaffProfile extends Model
{
    protected $fillable = ['user_id', 'profession', 'license_number', 'status'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
