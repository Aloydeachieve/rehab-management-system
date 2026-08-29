<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMedicationAdministrationRequest;
use App\Models\MedicationAdministration;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicationAdministrationController extends Controller
{
    /**
     * Helper to validate patient access for clinicians and staff.
     */
    private function validatePatientAccess(Patient $patient): void
    {
        $user = auth()->user();

        if ($user->isAdmin() || $user->isReceptionist()) {
            return;
        }

        if ($user->isDoctor()) {
            $isAssigned = $patient->appointments()
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
        $user = auth()->user();

        $dateStr = $request->query('date', now()->toDateString());
        $startDate = \Carbon\Carbon::parse($dateStr)->startOfDay();
        $endDate = \Carbon\Carbon::parse($dateStr)->endOfDay();

        $query = MedicationAdministration::with(['patient', 'prescriptionItem', 'administeringStaff'])
            ->whereBetween('scheduled_at', [$startDate, $endDate]);

        // If user is doctor, only return patients they are assigned to
        if ($user->isDoctor()) {
            $assignedPatientIds = Patient::whereHas('appointments', function ($q) use ($user) {
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
     * Record a new medication administration (Admin/Receptionist only).
     */
    public function store(StoreMedicationAdministrationRequest $request): JsonResponse
    {
        $this->validateWriteAccess();

        $patient = Patient::findOrFail($request->patient_id);
        $this->validatePatientAccess($patient);

        $data = $request->validated();

        $adminData = [
            'patient_id' => $data['patient_id'],
            'prescription_item_id' => $data['prescription_item_id'],
            'scheduled_at' => $data['scheduled_at'],
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
