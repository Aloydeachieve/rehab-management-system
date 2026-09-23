<?php

namespace App\Services;

use App\Models\MedicationAdministration;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class MedicationScheduleService
{
    /**
     * Normalize any clinical or colloquial frequency string into structured slot definitions.
     */
    public static function normalizeFrequency(?string $frequency): array
    {
        $raw = trim(strtolower((string) $frequency));
        $clean = preg_replace('/[^a-z0-9]/', '', $raw);

        // 1. Four times daily (QID / 4x)
        if (
            str_contains($clean, 'four') ||
            str_contains($clean, '4x') ||
            str_contains($clean, 'qid') ||
            str_contains($clean, 'qds') ||
            str_contains($clean, 'q6h') ||
            $clean === '4'
        ) {
            return [
                'type' => 'four_times_daily',
                'label' => 'Four times daily (Morning · Afternoon · Evening · Night)',
                'doses_per_day' => 4,
                'slots' => [
                    ['slot' => 'morning', 'time' => '08:00'],
                    ['slot' => 'afternoon', 'time' => '14:00'],
                    ['slot' => 'evening', 'time' => '18:00'],
                    ['slot' => 'night', 'time' => '22:00'],
                ],
            ];
        }

        // 2. Three times daily (TID / 3x)
        if (
            str_contains($clean, 'three') ||
            str_contains($clean, '3x') ||
            str_contains($clean, 'tid') ||
            str_contains($clean, 'tds') ||
            str_contains($clean, 'q8h') ||
            $clean === '3'
        ) {
            return [
                'type' => 'three_times_daily',
                'label' => 'Three times daily (Morning · Afternoon · Night)',
                'doses_per_day' => 3,
                'slots' => [
                    ['slot' => 'morning', 'time' => '08:00'],
                    ['slot' => 'afternoon', 'time' => '14:00'],
                    ['slot' => 'night', 'time' => '20:00'],
                ],
            ];
        }

        // 3. Twice daily (BID / 2x / numeric "2")
        if (
            str_contains($clean, 'twice') ||
            str_contains($clean, '2x') ||
            str_contains($clean, 'bid') ||
            str_contains($clean, 'bd') ||
            str_contains($clean, 'q12h') ||
            $clean === '2'
        ) {
            return [
                'type' => 'twice_daily',
                'label' => 'Twice daily (Morning · Night)',
                'doses_per_day' => 2,
                'slots' => [
                    ['slot' => 'morning', 'time' => '08:00'],
                    ['slot' => 'night', 'time' => '20:00'],
                ],
            ];
        }

        // 4. Default: Once daily (QD / 1x / numeric "1")
        return [
            'type' => 'once_daily',
            'label' => 'Once daily (Morning · 08:00)',
            'doses_per_day' => 1,
            'slots' => [
                ['slot' => 'morning', 'time' => '08:00'],
            ],
        ];
    }

    /**
     * Parse duration strings like '30 days', '2 weeks', '1 month', or '30' into integer days.
     */
    public static function parseDurationDays(?string $duration): int
    {
        if (empty($duration)) {
            return 7; // standard clinical default
        }

        if (preg_match('/(\d+)\s*(week|month|day)?/i', $duration, $matches)) {
            $value = (int) $matches[1];
            $unit = strtolower($matches[2] ?? 'day');

            if ($unit === 'week') {
                return max(1, $value * 7);
            }
            if ($unit === 'month') {
                return max(1, $value * 30);
            }
            return max(1, $value);
        }

        return 7;
    }

    /**
     * Generate individual scheduled dose administration records for a prescription item across its duration.
     * Idempotent: guarantees no duplicate records for the same patient, item, scheduled_at, and slot.
     */
    public static function generateDoseAdministrations(PrescriptionItem $item, mixed $arg2 = null, mixed $arg3 = null): int
    {
        $prescription = $item->prescription ?? Prescription::find($item->prescription_id);
        $patientId = $prescription?->patient_id;

        // Support both generateDoseAdministrations($item, $startDate) and generateDoseAdministrations($item, $patientId, $startDate)
        $startDate = null;
        if (is_int($arg2) && $arg2 > 0) {
            $patientId = $arg2;
            $startDate = $arg3;
        } else {
            $startDate = $arg2;
        }

        if (!$patientId) {
            return 0;
        }

        if (is_string($startDate)) {
            $startDate = Carbon::parse($startDate);
        }

        $normalized = self::normalizeFrequency($item->frequency);
        $days = self::parseDurationDays($item->duration);
        $start = $startDate ? $startDate->copy()->startOfDay() : ($prescription?->prescribed_at ? Carbon::parse($prescription->prescribed_at)->startOfDay() : now()->startOfDay());

        $count = 0;
        for ($d = 0; $d < $days; $d++) {
            $currentDay = $start->copy()->addDays($d);

            foreach ($normalized['slots'] as $slotDef) {
                $scheduledAt = $currentDay->copy()->setTimeFromTimeString($slotDef['time']);

                // Idempotent creation
                $admin = MedicationAdministration::firstOrCreate([
                    'patient_id' => $patientId,
                    'prescription_item_id' => $item->id,
                    'scheduled_at' => $scheduledAt,
                    'dose_slot' => $slotDef['slot'],
                ], [
                    'status' => 'scheduled',
                ]);

                if ($admin->wasRecentlyCreated) {
                    $count++;
                }
            }
        }

        return $count;
    }

    /**
     * Ensure all active prescriptions for a specific patient have their scheduled dose records present for a target date.
     * Idempotently backfills missing slot records (e.g. night dose for 2xdaily or afternoon/night for 3xdaily).
     */
    public static function ensureActivePrescriptionsScheduled(Patient $patient, mixed $date = null): void
    {
        if (is_string($date)) {
            $targetDate = Carbon::parse($date)->startOfDay();
        } elseif ($date instanceof Carbon) {
            $targetDate = $date->copy()->startOfDay();
        } else {
            $targetDate = now()->startOfDay();
        }

        $activePrescriptions = $patient->prescriptions()
            ->where('status', 'active')
            ->with('items')
            ->get();

        foreach ($activePrescriptions as $prescription) {
            self::ensurePrescriptionScheduledForDate($prescription, $patient->id, $targetDate);
        }
    }

    /**
     * Ensure all active prescriptions facility-wide have their scheduled dose records present for a target date.
     */
    public static function ensureActivePrescriptionsScheduledForAllPatients(mixed $date = null): void
    {
        if (is_string($date)) {
            $targetDate = Carbon::parse($date)->startOfDay();
        } elseif ($date instanceof Carbon) {
            $targetDate = $date->copy()->startOfDay();
        } else {
            $targetDate = now()->startOfDay();
        }

        $activePrescriptions = Prescription::where('status', 'active')
            ->with(['items', 'patient'])
            ->get();

        foreach ($activePrescriptions as $prescription) {
            if (!$prescription->patient_id) {
                continue;
            }
            self::ensurePrescriptionScheduledForDate($prescription, $prescription->patient_id, $targetDate);
        }

        // Backfill any legacy records where dose_slot IS NULL for this target date
        self::normalizeLegacyNullSlotsForDate($targetDate);
    }

    /**
     * Ensure a single active prescription has its dose records generated for a target date if within duration.
     */
    public static function ensurePrescriptionScheduledForDate(Prescription $prescription, int $patientId, Carbon $targetDate): void
    {
        $prescribedAt = $prescription->prescribed_at ? Carbon::parse($prescription->prescribed_at)->startOfDay() : now()->startOfDay();

        foreach ($prescription->items as $item) {
            $days = self::parseDurationDays($item->duration);
            $prescriptionEnd = $prescribedAt->copy()->addDays($days)->endOfDay();

            // Only generate if target date is on or after prescription start, and within duration
            if ($targetDate->lt($prescribedAt) || $targetDate->gt($prescriptionEnd)) {
                continue;
            }

            $normalized = self::normalizeFrequency($item->frequency);

            foreach ($normalized['slots'] as $slotDef) {
                $scheduledAt = $targetDate->copy()->setTimeFromTimeString($slotDef['time']);

                // Check if an administration already exists for this slot on this day
                $existing = MedicationAdministration::where('patient_id', $patientId)
                    ->where('prescription_item_id', $item->id)
                    ->whereDate('scheduled_at', $targetDate->toDateString())
                    ->where('dose_slot', $slotDef['slot'])
                    ->first();

                if (!$existing) {
                    MedicationAdministration::create([
                        'patient_id' => $patientId,
                        'prescription_item_id' => $item->id,
                        'scheduled_at' => $scheduledAt,
                        'dose_slot' => $slotDef['slot'],
                        'status' => 'scheduled',
                    ]);
                }
            }
        }
    }

    /**
     * Normalize legacy medication administrations where dose_slot was stored as null.
     */
    public static function normalizeLegacyNullSlotsForDate(mixed $targetDate): void
    {
        $dateStr = $targetDate instanceof Carbon ? $targetDate->toDateString() : (string) $targetDate;

        $legacyRows = MedicationAdministration::whereDate('scheduled_at', $dateStr)
            ->whereNull('dose_slot')
            ->get();

        foreach ($legacyRows as $row) {
            $hour = (int) Carbon::parse($row->scheduled_at)->format('H');
            if ($hour < 12) {
                $slot = 'morning';
            } elseif ($hour < 16) {
                $slot = 'afternoon';
            } elseif ($hour < 20) {
                $slot = 'evening';
            } else {
                $slot = 'night';
            }

            $row->update(['dose_slot' => $slot]);
        }
    }

    /**
     * Calculate individual medication regimen adherence for a single day.
     * 
     * Rules:
     * - Any scheduled dose refused or missed => 'incomplete'
     * - All scheduled doses given => 'completed'
     * - Some given + future doses pending => 'in_progress'
     * - All doses still scheduled / pending => 'in_progress'
     * - If no doses expected or cancelled => 'in_progress'
     */
    public static function calculateDayAdherence(array $slotDoses, array $expectedSlotKeys): string
    {
        if (empty($expectedSlotKeys)) {
            return 'in_progress';
        }

        $hasRefusedOrMissed = false;
        $allGiven = true;

        foreach ($expectedSlotKeys as $slotKey) {
            $dose = $slotDoses[$slotKey] ?? null;

            if (!$dose) {
                // An expected dose record is missing or not given yet
                $allGiven = false;
                continue;
            }

            $status = $dose['status'] ?? ($dose->status ?? 'scheduled');

            if (in_array($status, ['refused', 'missed'])) {
                $hasRefusedOrMissed = true;
            }

            if ($status !== 'given') {
                $allGiven = false;
            }
        }

        if ($hasRefusedOrMissed) {
            return 'incomplete';
        }

        if ($allGiven) {
            return 'completed';
        }

        return 'in_progress';
    }

    /**
     * Calculate overall patient medication adherence across all active regimens for the day.
     *
     * Rules:
     * - If any regimen is 'incomplete' => 'incomplete'
     * - If ALL regimens are 'completed' (and at least one regimen exists) => 'completed'
     * - Otherwise => 'in_progress'
     */
    public static function calculateOverallDayAdherence(array $regimenStatuses): string
    {
        if (empty($regimenStatuses)) {
            return 'in_progress';
        }

        if (in_array('incomplete', $regimenStatuses, true)) {
            return 'incomplete';
        }

        $allCompleted = true;
        foreach ($regimenStatuses as $status) {
            if ($status !== 'completed') {
                $allCompleted = false;
                break;
            }
        }

        if ($allCompleted) {
            return 'completed';
        }

        return 'in_progress';
    }
}
