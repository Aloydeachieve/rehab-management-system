<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAssessmentRequest;
use App\Http\Requests\StoreClinicalNoteRequest;
use App\Http\Requests\StoreMedicalHistoryRequest;
use App\Http\Requests\StorePrescriptionRequest;
use App\Http\Requests\StoreProgressNoteRequest;
use App\Http\Requests\StoreTreatmentPlanRequest;
use App\Http\Requests\StoreVitalSignRequest;
use App\Models\Assessment;
use App\Models\ClinicalNote;
use App\Models\MedicalHistory;
use App\Models\MedicationAdministration;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\ProgressNote;
use App\Models\TreatmentPlan;
use App\Models\VitalSign;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ClinicalController extends Controller
{
    /**
     * Helper to validate that the logged-in user is authorized to view/write
     * clinical records for the given patient.
     */
    private function validatePatientAccess(Patient $patient): void
    {
        $user = auth()->user();

        if ($user->isAdmin()) {
            return;
        }

        if ($user->isReceptionist()) {
            abort(403, 'Receptionists are not authorized to access clinical records.');
        }

        if ($user->isDoctor()) {
            $isAssigned = $patient->appointments()
                ->where('assigned_staff_id', $user->id)
                ->exists();

            if (!$isAssigned) {
                abort(403, 'You are not assigned/authorized to access this patient\'s clinical records.');
            }
            return;
        }

        abort(403, 'Unauthorized access.');
    }

    // =========================================================================
    // MEDICAL HISTORY
    // =========================================================================

    public function getMedicalHistory(Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $records = $patient->medicalHistories()
            ->with('recordedBy')
            ->latest()
            ->paginate(15);

        return response()->json($records);
    }

    public function storeMedicalHistory(StoreMedicalHistoryRequest $request, Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $record = MedicalHistory::create([
            'patient_id' => $patient->id,
            'recorded_by' => auth()->id(),
            'content' => $request->content,
            'recorded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Medical history entry recorded successfully.',
            'data' => $record->load('recordedBy'),
        ], 201);
    }

    // =========================================================================
    // ASSESSMENTS
    // =========================================================================

    public function getAssessments(Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $records = $patient->assessments()
            ->with('practitioner')
            ->latest()
            ->paginate(15);

        return response()->json($records);
    }

    public function storeAssessment(StoreAssessmentRequest $request, Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $record = Assessment::create([
            'patient_id' => $patient->id,
            'practitioner_id' => auth()->id(),
            'assessment_type' => $request->assessment_type,
            'findings' => $request->findings,
            'recommendation' => $request->recommendation,
            'recorded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Assessment recorded successfully.',
            'data' => $record->load('practitioner'),
        ], 201);
    }

    // =========================================================================
    // VITAL SIGNS
    // =========================================================================

    public function getVitalSigns(Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $records = $patient->vitalSigns()
            ->with('recordedBy')
            ->latest()
            ->paginate(15);

        return response()->json($records);
    }

    public function storeVitalSign(StoreVitalSignRequest $request, Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $record = VitalSign::create([
            'patient_id' => $patient->id,
            'recorded_by' => auth()->id(),
            'temperature' => $request->temperature,
            'pulse' => $request->pulse,
            'blood_pressure' => $request->blood_pressure,
            'respiratory_rate' => $request->respiratory_rate,
            'weight' => $request->weight,
            'notes' => $request->notes,
            'recorded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Vital signs logged successfully.',
            'data' => $record->load('recordedBy'),
        ], 201);
    }

    // =========================================================================
    // CLINICAL NOTES
    // =========================================================================

    public function getClinicalNotes(Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $records = $patient->clinicalNotes()
            ->with('practitioner')
            ->latest()
            ->paginate(15);

        return response()->json($records);
    }

    public function storeClinicalNote(StoreClinicalNoteRequest $request, Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $record = ClinicalNote::create([
            'patient_id' => $patient->id,
            'practitioner_id' => auth()->id(),
            'note_type' => $request->note_type,
            'content' => $request->content,
            'recorded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Clinical note added successfully.',
            'data' => $record->load('practitioner'),
        ], 201);
    }

    // =========================================================================
    // PRESCRIPTIONS
    // =========================================================================

    public function getPrescriptions(Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $records = $patient->prescriptions()
            ->with(['practitioner', 'items'])
            ->latest()
            ->paginate(15);

        return response()->json($records);
    }

    public function storePrescription(StorePrescriptionRequest $request, Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $prescription = DB::transaction(function () use ($request, $patient) {
            $prescription = Prescription::create([
                'patient_id' => $patient->id,
                'practitioner_id' => auth()->id(),
                'status' => 'active',
                'notes' => $request->notes,
                'prescribed_at' => now(),
            ]);

            foreach ($request->items as $item) {
                $prescriptionItem = $prescription->items()->create([
                    'medication_name' => $item['medication_name'],
                    'dosage' => $item['dosage'],
                    'frequency' => $item['frequency'],
                    'duration' => $item['duration'],
                    'instructions' => $item['instructions'] ?? null,
                ]);

                // Auto-generate medication administration slots
                $days = 7; // default fallback
                if (preg_match('/(\d+)/', $item['duration'], $matches)) {
                    $days = (int) $matches[1];
                }

                $frequency = strtolower($item['frequency']);
                $times = ['09:00']; // default once daily

                if (str_contains($frequency, 'twice') || str_contains($frequency, 'bid')) {
                    $times = ['09:00', '21:00'];
                } elseif (str_contains($frequency, 'three') || str_contains($frequency, 'tid')) {
                    $times = ['09:00', '15:00', '21:00'];
                }

                $startDate = now()->startOfDay();
                for ($d = 0; $d < $days; $d++) {
                    $currentDate = $startDate->copy()->addDays($d);
                    foreach ($times as $time) {
                        $scheduledAt = $currentDate->copy()->setTimeFromTimeString($time);
                        // Only skip slots that are strictly before today
                        if ($scheduledAt->isBefore(now()->startOfDay())) {
                            continue;
                        }

                        MedicationAdministration::create([
                            'patient_id' => $patient->id,
                            'prescription_item_id' => $prescriptionItem->id,
                            'scheduled_at' => $scheduledAt,
                            'status' => 'scheduled',
                        ]);
                    }
                }
            }

            return $prescription;
        });

        return response()->json([
            'message' => 'Prescription created successfully.',
            'data' => $prescription->load(['practitioner', 'items']),
        ], 201);
    }

    // =========================================================================
    // TREATMENT PLANS
    // =========================================================================

    public function getTreatmentPlans(Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $records = $patient->treatmentPlans()
            ->with('practitioner')
            ->latest()
            ->paginate(15);

        return response()->json($records);
    }

    public function storeTreatmentPlan(StoreTreatmentPlanRequest $request, Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $plan = DB::transaction(function () use ($request, $patient) {
            // Deactivate all previous active treatment plans for this patient
            TreatmentPlan::where('patient_id', $patient->id)
                ->where('status', 'active')
                ->update(['status' => 'completed']);

            // Create new active plan
            return TreatmentPlan::create([
                'patient_id' => $patient->id,
                'practitioner_id' => auth()->id(),
                'goals' => $request->goals,
                'plan' => $request->plan,
                'review_date' => $request->review_date,
                'status' => $request->status ?? 'active',
            ]);
        });

        return response()->json([
            'message' => 'Treatment plan logged successfully.',
            'data' => $plan->load('practitioner'),
        ], 201);
    }

    // =========================================================================
    // PROGRESS NOTES
    // =========================================================================

    public function getProgressNotes(Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $records = $patient->progressNotes()
            ->with('practitioner')
            ->latest()
            ->paginate(15);

        return response()->json($records);
    }

    public function storeProgressNote(StoreProgressNoteRequest $request, Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $record = ProgressNote::create([
            'patient_id' => $patient->id,
            'practitioner_id' => auth()->id(),
            'content' => $request->content,
            'recorded_at' => now(),
        ]);

        return response()->json([
            'message' => 'Progress note added successfully.',
            'data' => $record->load('practitioner'),
        ], 201);
    }
}
