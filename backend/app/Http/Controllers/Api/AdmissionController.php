<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admission;
use App\Models\Patient;
use App\Models\TreatmentSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdmissionController extends Controller
{
    /**
     * Display a listing of active admissions (Staff only).
     */
    public function index(): JsonResponse
    {
        $admissions = Admission::with(['patient', 'admittedBy'])
            ->where('status', 'active')
            ->latest()
            ->paginate(15);

        return response()->json($admissions);
    }

    /**
     * Store a newly created admission record for a patient (Admin/Receptionist only).
     */
    public function store(Request $request, Patient $patient): JsonResponse
    {
        $data = $request->validate([
            'admission_date' => ['required', 'date', 'before_or_equal:today'],
            'admission_type' => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ]);

        // Verify if patient already has an active admission
        $activeAdmissionExists = $patient->admissions()
            ->where('status', 'active')
            ->exists();

        if ($activeAdmissionExists) {
            return response()->json([
                'message' => 'This patient is already active in a residential admission.',
            ], 422);
        }

        $admission = DB::transaction(function () use ($data, $patient) {
            $admission = Admission::create([
                'patient_id' => $patient->id,
                'admission_date' => $data['admission_date'],
                'admission_type' => $data['admission_type'],
                'admitted_by' => auth()->id(),
                'status' => 'active',
                'notes' => $data['notes'] ?? null,
            ]);

            // Ensure patient status is active
            $patient->update(['status' => 'active']);

            // Calculate expected end date using configured duration
            $pricingService = app(\App\Services\TreatmentPricingService::class);
            $durationDays = $pricingService->getSessionDurationDays();
            $initialPrice = $pricingService->getPriceForSessionNumber(1);

            $startDate = \Carbon\Carbon::parse($data['admission_date']);
            $expectedEndDate = $startDate->copy()->addDays($durationDays);

            // Create initial residential session 1
            TreatmentSession::create([
                'patient_id' => $patient->id,
                'session_number' => 1,
                'session_price' => $initialPrice,
                'start_date' => $startDate->toDateString(),
                'expected_end_date' => $expectedEndDate->toDateString(),
                'status' => 'active',
                'payment_status' => 'unpaid',
            ]);

            return $admission;
        });

        return response()->json([
            'message' => 'Patient admitted successfully.',
            'admission' => $admission->load('patient', 'admittedBy'),
        ], 201);
    }

    /**
     * Get admission records specifically for a patient.
     */
    public function patientAdmissions(Patient $patient): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        if ($user->isDoctor()) {
            $isAssigned = $patient->doctorAssignments()
                ->where('doctor_id', $user->id)
                ->where('status', 'active')
                ->exists()
                || $patient->appointments()
                ->where('assigned_staff_id', $user->id)
                ->exists();

            if (! $isAssigned) {
                abort(403, 'You are not assigned/authorized to access this patient\'s admissions.');
            }
        }

        $admissions = $patient->admissions()->with('admittedBy')->latest()->get();
        return response()->json(['admissions' => $admissions]);
    }
}
