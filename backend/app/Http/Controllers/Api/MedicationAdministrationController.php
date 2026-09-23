<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMedicationAdministrationRequest;
use App\Models\MedicationAdministration;
use App\Models\Patient;
use App\Services\MedicationScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicationAdministrationController extends Controller
{
    /**
     * Helper to validate patient access for clinicians and staff.
     */
    private function validatePatientAccess(Patient $patient): void
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        if ($user->isAdmin() || $user->isReceptionist()) {
            return;
        }

        if ($user->isDoctor()) {
            $isAssigned = $patient->doctorAssignments()
                ->where('doctor_id', $user->id)
                ->where('status', 'active')
                ->exists()
                || $patient->appointments()
                ->where('assigned_staff_id', $user->id)
                ->exists();

            if (!$isAssigned) {
                abort(403, 'You are not assigned/authorized to access this patient\'s medication details.');
            }
            return;
        }

        abort(403, 'Unauthorized access.');
    }

    /**
     * Helper to validate administration write access (Admin and Receptionist/Staff only).
     */
    private function validateWriteAccess(): void
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        if (!$user->isAdmin() && !$user->isReceptionist()) {
            abort(403, 'Only administrators and receptionists/staff can record medication administrations.');
        }
    }

    /**
     * Get medication administrations across all patients (optionally filtered by date).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        $dateStr = $request->query('date', now()->toDateString());
        $startDate = \Carbon\Carbon::parse($dateStr)->startOfDay();
        $endDate = \Carbon\Carbon::parse($dateStr)->endOfDay();

        // Ensure active prescriptions have their dose administration records generated facility-wide for this date
        app(MedicationScheduleService::class)->ensureActivePrescriptionsScheduledForAllPatients($startDate);

        $query = MedicationAdministration::with(['patient', 'prescriptionItem', 'administeringStaff'])
            ->whereBetween('scheduled_at', [$startDate, $endDate]);

        // If user is doctor, return patients assigned via persistent assignment or appointments
        if ($user->isDoctor()) {
            $assignedPatientIds = Patient::whereHas('doctorAssignments', function ($q) use ($user) {
                $q->where('doctor_id', $user->id)->where('status', 'active');
            })->orWhereHas('appointments', function ($q) use ($user) {
                $q->where('assigned_staff_id', $user->id);
            })->pluck('id');

            $query->whereIn('patient_id', $assignedPatientIds);
        }

        $records = $query->orderBy('scheduled_at', 'asc')->get();

        return response()->json($records);
    }

    /**
     * Get patient's prescriptions (receptionist/staff and doctors view).
     */
    public function getPatientPrescriptions(Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $prescriptions = $patient->prescriptions()
            ->with(['practitioner', 'items'])
            ->latest()
            ->get();

        return response()->json($prescriptions);
    }

    /**
     * Get patient's medication administrations.
     */
    public function getPatientAdministrations(Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $records = $patient->medicationAdministrations()
            ->with(['prescriptionItem', 'administeringStaff'])
            ->orderBy('scheduled_at', 'desc')
            ->paginate(15);

        return response()->json($records);
    }

    /**
     * Get comprehensive dose-level medication workspace for a specific patient.
     */
    public function getPatientMedicationWorkspace(Request $request, Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $dateStr = $request->query('date', now()->toDateString());
        $startDate = \Carbon\Carbon::parse($dateStr)->startOfDay();
        $endDate = \Carbon\Carbon::parse($dateStr)->endOfDay();

        $scheduleService = app(MedicationScheduleService::class);
        $scheduleService->ensureActivePrescriptionsScheduled($patient, $startDate);
        $scheduleService->normalizeLegacyNullSlotsForDate($startDate);

        // 1. Active Prescriptions
        $activePrescriptions = $patient->prescriptions()
            ->with(['practitioner', 'items'])
            ->where('status', 'active')
            ->latest()
            ->get()
            ->map(function ($presc) use ($scheduleService) {
                return [
                    'id' => $presc->id,
                    'prescribed_at' => $presc->prescribed_at,
                    'practitioner' => $presc->practitioner ? [
                        'id' => $presc->practitioner->id,
                        'name' => $presc->practitioner->name,
                    ] : null,
                    'notes' => $presc->notes,
                    'status' => $presc->status,
                    'items' => $presc->items->map(function ($item) use ($scheduleService) {
                        $norm = $scheduleService->normalizeFrequency($item->frequency);

                        return [
                            'id' => $item->id,
                            'prescription_id' => $item->prescription_id,
                            'medication_name' => $item->medication_name,
                            'dosage' => $item->dosage,
                            'frequency' => $item->frequency,
                            'duration' => $item->duration,
                            'instructions' => $item->instructions,
                            'schedule_label' => $norm['label'],
                            'doses_per_day' => $norm['doses_per_day'],
                            'expected_slots' => array_column($norm['slots'], 'slot'),
                        ];
                    }),
                ];
            });

        // 2. Today's Dose Schedule for this patient
        $todayAdministrations = MedicationAdministration::with(['prescriptionItem', 'administeringStaff'])
            ->where('patient_id', $patient->id)
            ->whereBetween('scheduled_at', [$startDate, $endDate])
            ->orderBy('scheduled_at', 'asc')
            ->get();

        // Group administrations by prescription_item_id
        $groupedSchedule = [];
        foreach ($activePrescriptions as $p) {
            foreach ($p['items'] as $item) {
                $norm = $scheduleService->normalizeFrequency($item['frequency']);
                $expectedSlots = array_column($norm['slots'], 'slot');

                $groupedSchedule[$item['id']] = [
                    'prescription_id' => $p['id'],
                    'prescription_item_id' => $item['id'],
                    'medication_name' => $item['medication_name'],
                    'dosage' => $item['dosage'],
                    'frequency' => $item['frequency'],
                    'instructions' => $item['instructions'],
                    'prescription_item' => [
                        'id' => $item['id'],
                        'medication_name' => $item['medication_name'],
                        'dosage' => $item['dosage'],
                        'frequency' => $item['frequency'],
                    ],
                    'schedule_label' => $norm['label'],
                    'doses_per_day' => $norm['doses_per_day'],
                    'expected_slots' => $expectedSlots,
                    'morning' => null,
                    'afternoon' => null,
                    'evening' => null,
                    'night' => null,
                    'day_status' => 'in_progress',
                ];
            }
        }

        foreach ($todayAdministrations as $admin) {
            $itemId = $admin->prescription_item_id;
            if (!isset($groupedSchedule[$itemId])) {
                $item = $admin->prescriptionItem;
                $norm = $scheduleService->normalizeFrequency($item?->frequency);
                $expectedSlots = array_column($norm['slots'], 'slot');

                $groupedSchedule[$itemId] = [
                    'prescription_id' => $item ? $item->prescription_id : null,
                    'prescription_item_id' => $itemId,
                    'medication_name' => $item ? $item->medication_name : 'Unknown Medication',
                    'dosage' => $item ? $item->dosage : '',
                    'frequency' => $item ? $item->frequency : '',
                    'instructions' => $item ? $item->instructions : null,
                    'prescription_item' => $item ? [
                        'id' => $item->id,
                        'medication_name' => $item->medication_name,
                        'dosage' => $item->dosage,
                        'frequency' => $item->frequency,
                    ] : null,
                    'schedule_label' => $norm['label'],
                    'doses_per_day' => $norm['doses_per_day'],
                    'expected_slots' => $expectedSlots,
                    'morning' => null,
                    'afternoon' => null,
                    'evening' => null,
                    'night' => null,
                    'day_status' => 'in_progress',
                ];
            }

            $slot = $admin->dose_slot;
            if (!$slot) {
                $hour = (int) $admin->scheduled_at->format('H');
                if ($hour < 12) $slot = 'morning';
                elseif ($hour < 16) $slot = 'afternoon';
                elseif ($hour < 20) $slot = 'evening';
                else $slot = 'night';
            }

            $adminData = [
                'id' => $admin->id,
                'scheduled_at' => $admin->scheduled_at,
                'dose_slot' => $slot,
                'status' => $admin->status,
                'administered_at' => $admin->administered_at,
                'notes' => $admin->notes,
                'administering_staff' => $admin->administeringStaff ? [
                    'id' => $admin->administeringStaff->id,
                    'name' => $admin->administeringStaff->name,
                ] : null,
            ];

            if ($slot === 'morning') $groupedSchedule[$itemId]['morning'] = $adminData;
            elseif ($slot === 'afternoon') $groupedSchedule[$itemId]['afternoon'] = $adminData;
            elseif ($slot === 'evening') $groupedSchedule[$itemId]['evening'] = $adminData;
            elseif ($slot === 'night') $groupedSchedule[$itemId]['night'] = $adminData;
        }

        // Calculate Day Status for each medication today and overall
        $regimenStatuses = [];
        foreach ($groupedSchedule as $itemId => &$entry) {
            $expectedSlots = $entry['expected_slots'] ?? ['morning'];
            $slotDoses = [
                'morning' => $entry['morning'],
                'afternoon' => $entry['afternoon'],
                'evening' => $entry['evening'],
                'night' => $entry['night'],
            ];

            $entry['day_status'] = $scheduleService->calculateDayAdherence($slotDoses, $expectedSlots);
            $entry['slots'] = $slotDoses;
            $regimenStatuses[] = $entry['day_status'];
        }
        unset($entry);

        $overallDayStatus = $scheduleService->calculateOverallDayAdherence($regimenStatuses);

        // 3. Discontinued Prescriptions
        $discontinuedPrescriptions = $patient->prescriptions()
            ->with(['practitioner', 'items'])
            ->where('status', 'discontinued')
            ->latest()
            ->get();

        // 4. Administration History with filters
        $historyFilter = $request->query('filter', 'all');
        $historyQuery = $patient->medicationAdministrations()
            ->with(['prescriptionItem', 'administeringStaff'])
            ->orderBy('scheduled_at', 'desc');

        if ($historyFilter === 'today') {
            $historyQuery->whereDate('scheduled_at', now()->toDateString());
        } elseif ($historyFilter === 'yesterday') {
            $historyQuery->whereDate('scheduled_at', now()->subDay()->toDateString());
        } elseif ($historyFilter === '7_days') {
            $historyQuery->where('scheduled_at', '>=', now()->subDays(7)->startOfDay());
        }

        $history = $historyQuery->paginate(20);

        return response()->json([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'patient_number' => $patient->patient_number,
            ],
            'selected_date' => $dateStr,
            'overall_day_status' => $overallDayStatus,
            'active_prescriptions' => $activePrescriptions,
            'today_schedule' => array_values($groupedSchedule),
            'discontinued_prescriptions' => $discontinuedPrescriptions,
            'history' => $history,
        ]);
    }

    /**
     * Record a new medication administration (Admin/Receptionist only).
     */
    public function store(StoreMedicationAdministrationRequest $request): JsonResponse
    {
        $this->validateWriteAccess();

        $patient = Patient::findOrFail($request->patient_id);
        $this->validatePatientAccess($patient);

        $data = $request->validated();

        $slot = $data['dose_slot'] ?? null;
        if (!$slot && !empty($data['scheduled_at'])) {
            $parsedHour = (int) \Carbon\Carbon::parse($data['scheduled_at'])->format('H');
            if ($parsedHour < 12) $slot = 'morning';
            elseif ($parsedHour < 17) $slot = 'afternoon';
            elseif ($parsedHour < 20) $slot = 'evening';
            else $slot = 'night';
        }

        $adminData = [
            'patient_id' => $data['patient_id'],
            'prescription_item_id' => $data['prescription_item_id'],
            'scheduled_at' => $data['scheduled_at'],
            'dose_slot' => $slot,
            'status' => $data['status'],
            'notes' => $data['notes'] ?? null,
            'administered_by' => auth()->id(),
        ];

        if ($data['status'] === 'given') {
            $adminData['administered_at'] = now();
        }

        $record = MedicationAdministration::create($adminData);

        return response()->json([
            'message' => 'Medication administration logged successfully.',
            'data' => $record->load(['prescriptionItem', 'administeringStaff']),
        ], 201);
    }

    /**
     * Update an existing scheduled medication administration (Admin/Receptionist only).
     */
    public function update(Request $request, MedicationAdministration $administration): JsonResponse
    {
        $this->validateWriteAccess();

        $patient = Patient::findOrFail($administration->patient_id);
        $this->validatePatientAccess($patient);

        $data = $request->validate([
            'status' => ['required', 'in:scheduled,given,missed,refused,cancelled'],
            'notes' => ['nullable', 'string'],
        ]);

        $updateData = [
            'status' => $data['status'],
            'notes' => $data['notes'] ?? $administration->notes,
            'administered_by' => auth()->id(),
        ];

        if ($data['status'] === 'given') {
            $updateData['administered_at'] = now();
        } else {
            $updateData['administered_at'] = null;
        }

        $administration->update($updateData);

        return response()->json([
            'message' => 'Medication administration updated successfully.',
            'data' => $administration->load(['prescriptionItem', 'administeringStaff']),
        ]);
    }
}
