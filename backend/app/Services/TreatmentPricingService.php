<?php

namespace App\Services;

use App\Models\TreatmentPricingConfig;
use App\Models\User;

class TreatmentPricingService
{
    public const DEFAULT_INITIAL_PRICE = 300000.00;
    public const DEFAULT_SUBSEQUENT_PRICE = 200000.00;
    public const DEFAULT_CURRENCY = 'NGN';
    public const DEFAULT_DURATION_DAYS = 30;

    /**
     * Get the current active pricing configuration.
     * If no configuration exists in the database, a default one is created.
     */
    public function getCurrentConfig(): TreatmentPricingConfig
    {
        $config = TreatmentPricingConfig::latest('id')->first();

        if (! $config) {
            $config = TreatmentPricingConfig::create([
                'initial_session_price' => self::DEFAULT_INITIAL_PRICE,
                'subsequent_session_price' => self::DEFAULT_SUBSEQUENT_PRICE,
                'currency' => self::DEFAULT_CURRENCY,
                'session_duration_days' => self::DEFAULT_DURATION_DAYS,
            ]);
        }

        return $config;
    }

    /**
     * Get the configured price for a given sequential session number.
     * Session 1 = Initial session price.
     * Session 2+ = Subsequent session price.
     */
    public function getPriceForSessionNumber(int $sessionNumber): float
    {
        $config = $this->getCurrentConfig();

        if ($sessionNumber <= 1) {
            return (float) $config->initial_session_price;
        }

        return (float) $config->subsequent_session_price;
    }

    /**
     * Get the configured standard session duration in days.
     */
    public function getSessionDurationDays(): int
    {
        $config = $this->getCurrentConfig();

        return (int) $config->session_duration_days;
    }

    /**
     * Update the pricing configuration.
     */
    public function updateConfig(array $data, ?User $user = null): TreatmentPricingConfig
    {
        return TreatmentPricingConfig::create([
            'initial_session_price' => round((float) $data['initial_session_price'], 2),
            'subsequent_session_price' => round((float) $data['subsequent_session_price'], 2),
            'currency' => strtoupper(trim($data['currency'] ?? self::DEFAULT_CURRENCY)),
            'session_duration_days' => (int) ($data['session_duration_days'] ?? self::DEFAULT_DURATION_DAYS),
            'updated_by' => $user?->id,
        ]);
    }
}
