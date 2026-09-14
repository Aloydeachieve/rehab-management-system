<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    public const STATUS_UNPAID = 'unpaid';
    public const STATUS_PARTIALLY_PAID = 'partially_paid';
    public const STATUS_PAID = 'paid';
    public const STATUS_OVERDUE = 'overdue';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'patient_id',
        'treatment_session_id',
        'invoice_number',
        'amount',
        'amount_paid',
        'balance',
        'due_date',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'balance' => 'decimal:2',
        'due_date' => 'date',
    ];

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function treatmentSession(): BelongsTo
    {
        return $this->belongsTo(TreatmentSession::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Recalculate invoice amount_paid, remaining balance, and lifecycle status based on recorded valid payments.
     */
    public function recalculateBalanceAndStatus(): self
    {
        $validPaid = (float) $this->payments()
            ->where('status', Payment::STATUS_SUCCESSFUL)
            ->sum('amount');

        $totalAmount = (float) $this->amount;
        $remainingBalance = max(0.00, round($totalAmount - $validPaid, 2));

        $this->amount_paid = number_format($validPaid, 2, '.', '');
        $this->balance = number_format($remainingBalance, 2, '.', '');

        if ($this->status !== self::STATUS_CANCELLED) {
            if ($remainingBalance <= 0.00) {
                $this->status = self::STATUS_PAID;
            } elseif ($validPaid > 0.00) {
                $this->status = self::STATUS_PARTIALLY_PAID;
            } else {
                $this->status = ($this->due_date && $this->due_date->isPast())
                    ? self::STATUS_OVERDUE
                    : self::STATUS_UNPAID;
            }
        }

        $this->save();

        // Synchronize treatment session payment status if linked
        if ($this->treatment_session_id && $this->treatmentSession) {
            $sessionStatus = match ($this->status) {
                self::STATUS_PAID => 'paid',
                self::STATUS_PARTIALLY_PAID => 'partially_paid',
                default => 'unpaid',
            };
            $this->treatmentSession->update(['payment_status' => $sessionStatus]);
        }

        return $this;
    }

    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function isOverdue(): bool
    {
        return $this->status === self::STATUS_OVERDUE ||
            (! $this->isPaid() && $this->due_date && $this->due_date->isPast());
    }
}
