<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\TreatmentSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TreatmentSessionController extends Controller
{
    /**
     * Helper to validate patient access for clinician/staff.
     */
    private function validatePatientAccess(Patient $patient): void
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        if ($user->isAdmin() || $user->isReceptionist()) {
            return;
        }

        if ($user->isDoctor()) {
            $isAssigned = $patient->appointments()
                ->where('assigned_staff_id', $user->id)
                ->exists();

            if (!$isAssigned) {
                abort(403, 'You are not assigned/authorized to access this patient\'s treatment sessions.');
            }
            return;
        }

        abort(403, 'Unauthorized access.');
    }

    /**
     * Helper to validate write access to treatment sessions (Admin/Doctor only).
     */
    private function validateWriteAccess(Patient $patient): void
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        if ($user->isReceptionist()) {
            abort(403, 'Receptionists are not authorized to perform clinical session decisions.');
        }

        $this->validatePatientAccess($patient);
    }

    /**
     * Display a listing of treatment sessions for a patient.
     */
    public function index(Request $request, Patient $patient): JsonResponse
    {
        $this->validatePatientAccess($patient);

        $sessions = $patient->treatmentSessions()
            ->with(['professional', 'reassessedByUser', 'decisionByUser'])
            ->orderBy('session_number', 'asc')
            ->get();

        return response()->json($sessions);
    }

    /**
     * Display a single treatment session.
     */
    public function show(TreatmentSession $session): JsonResponse
    {
        $session->load('patient');
        $this->validatePatientAccess($session->patient);

        /** @var \App\Models\User $user */
        $user = auth()->user();

        // If user is doctor or admin, load clinical records logged during this session
        if ($user->isAdmin() || $user->isDoctor()) {
            $session->load([
                'professional',
                'reassessedByUser',
                'decisionByUser',
                'assessments.practitioner',
                'clinicalNotes.practitioner',
                'prescriptions.practitioner',
                'treatmentPlans.practitioner',
                'progressNotes.practitioner'
            ]);
        } else {
            // Receptionists only get basic operational info
            $session->load(['professional', 'reassessedByUser', 'decisionByUser']);
        }

        return response()->json($session);
    }

    /**
     * Manually store/initiate a new treatment session for a patient (Admin/Doctor only).
     */
    public function store(Request $request, Patient $patient): JsonResponse
    {
        $this->validateWriteAccess($patient);

        $data = $request->validate([
            'start_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
            'professional_id' => ['nullable', 'exists:users,id'],
        ]);

        // Prevent duplicate active sessions
        $hasActiveSession = $patient->treatmentSessions()
            ->where('status', 'active')
            ->exists();

        if ($hasActiveSession) {
            return response()->json([
                'message' => 'This patient already has an active treatment session.',
            ], 422);
        }

        $nextSessionNumber = $patient->treatmentSessions()->max('session_number') + 1;

        $pricingService = app(\App\Services\TreatmentPricingService::class);
        $durationDays = $pricingService->getSessionDurationDays();
        $sessionPrice = $pricingService->getPriceForSessionNumber($nextSessionNumber);

        // Start date & expected end date (configured duration)
        $startDate = \Carbon\Carbon::parse($data['start_date']);
        $expectedEndDate = $startDate->copy()->addDays($durationDays);

        $session = TreatmentSession::create([
            'patient_id' => $patient->id,
            'session_number' => $nextSessionNumber,
            'session_price' => $sessionPrice,
            'start_date' => $startDate->toDateString(),
            'expected_end_date' => $expectedEndDate->toDateString(),
            'status' => 'active',
            'professional_id' => $data['professional_id'] ?? auth()->id(),
            'notes' => $data['notes'] ?? null,
            'payment_status' => 'unpaid',
        ]);

        // Ensure patient status matches
        $patient->update(['status' => 'active']);

        return response()->json([
            'message' => 'Treatment session initiated successfully.',
            'session' => $session->load(['professional']),
        ], 201);
    }

    /**
     * Record a professional reassessment recommendation.
     */
    public function reassessment(Request $request, TreatmentSession $session): JsonResponse
    {
        $session->load('patient');
        $this->validateWriteAccess($session->patient);

        $data = $request->validate([
            'recommendation' => ['required', 'string', 'in:continue,discharge'],
            'notes' => ['required', 'string', 'min:5'],
        ]);

        if ($session->status !== 'active') {
            return response()->json([
                'message' => 'Reassessments can only be recorded on active sessions.',
            ], 422);
        }

        $session->update([
            'recommendation' => $data['recommendation'],
            'notes' => $data['notes'],
            'reassessed_by' => auth()->id(),
            'reassessed_at' => now(),
        ]);

        return response()->json([
            'message' => 'Professional reassessment logged successfully.',
            'session' => $session->load(['professional', 'reassessedByUser']),
        ]);
    }

    /**
     * Continue treatment: close active session and spawn a new sequential 30-day session.
     */
    public function continueTreatment(Request $request, TreatmentSession $session): JsonResponse
    {
        $session->load('patient');
        $this->validateWriteAccess($session->patient);

        if ($session->status !== 'active') {
            return response()->json([
                'message' => 'Only active sessions can be continued.',
            ], 422);
        }

        if (!$session->reassessed_at || $session->recommendation !== 'continue') {
            return response()->json([
                'message' => 'A reassessment recommending continuation must be recorded first.',
            ], 422);
        }

        $newSession = DB::transaction(function () use ($session) {
            // Lock active session to prevent race conditions on double submission
            $activeSession = TreatmentSession::lockForUpdate()->find($session->id);

            if ($activeSession->status !== 'active') {
                abort(422, 'This session has already been processed.');
            }

            // Close current session
            $activeSession->update([
                'status' => 'completed',
                'actual_end_date' => now()->toDateString(),
                'decision_by' => auth()->id(),
                'decision_at' => now(),
            ]);

            // Spawn next session with configured pricing and duration
            $pricingService = app(\App\Services\TreatmentPricingService::class);
            $durationDays = $pricingService->getSessionDurationDays();
            $nextSessionNumber = $activeSession->session_number + 1;
            $sessionPrice = $pricingService->getPriceForSessionNumber($nextSessionNumber);

            return TreatmentSession::create([
                'patient_id' => $activeSession->patient_id,
                'session_number' => $nextSessionNumber,
                'session_price' => $sessionPrice,
                'start_date' => now()->toDateString(),
                'expected_end_date' => now()->addDays($durationDays)->toDateString(),
                'status' => 'active',
                'payment_status' => 'unpaid',
                'professional_id' => $activeSession->professional_id,
            ]);
        });

        return response()->json([
            'message' => 'Treatment continued successfully. New session initiated.',
            'session' => $newSession->load(['professional']),
        ], 201);
    }

    /**
     * Discharge patient: close session and mark patient as discharged.
     */
    public function discharge(Request $request, TreatmentSession $session): JsonResponse
    {
        $session->load('patient');
        $this->validateWriteAccess($session->patient);

        if ($session->status !== 'active') {
            return response()->json([
                'message' => 'Only active sessions can be discharged.',
            ], 422);
        }

        if (!$session->reassessed_at || $session->recommendation !== 'discharge') {
            return response()->json([
                'message' => 'A reassessment recommending discharge must be recorded first.',
            ], 422);
        }

        DB::transaction(function () use ($session) {
            $activeSession = TreatmentSession::lockForUpdate()->find($session->id);

            if ($activeSession->status !== 'active') {
                abort(422, 'This session has already been processed.');
            }

            // Close session
            $activeSession->update([
                'status' => 'discharged',
                'actual_end_date' => now()->toDateString(),
                'decision_by' => auth()->id(),
                'decision_at' => now(),
            ]);

            // Update Patient status to discharged
            $activeSession->patient->update(['status' => 'discharged']);
        });

        return response()->json([
            'message' => 'Patient discharged successfully.',
            'session' => $session->fresh(['professional', 'reassessedByUser', 'decisionByUser']),
        ]);
    }

    /**
     * Operational overview listing of treatment sessions across patients.
     */
    public function overview(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        $query = TreatmentSession::with(['patient', 'professional', 'invoice', 'decisionByUser']);

        // Doctor restriction: only patients assigned via appointments
        if ($user->isDoctor() && !$user->isAdmin()) {
            $assignedPatientIds = \App\Models\Appointment::where('assigned_staff_id', $user->id)
                ->whereNotNull('patient_id')
                ->pluck('patient_id');
            $query->whereIn('patient_id', $assignedPatientIds);
        }

        // Status filter (default to all active unless specified)
        $status = $request->query('status', 'active');
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        // Approaching end filter (within 7 days)
        if ($request->boolean('approaching_end')) {
            $query->where('status', 'active')
                ->whereDate('expected_end_date', '<=', now()->addDays(7)->toDateString());
        }

        // Decision state filter
        if ($request->query('decision_state') === 'needs_reassessment') {
            $query->where('status', 'active')->whereNull('reassessed_at');
        } elseif ($request->query('decision_state') === 'needs_decision') {
            $query->where('status', 'active')->whereNotNull('reassessed_at')->whereNull('decision_at');
        }

        // Payment status filter
        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        // Search by patient name or number
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('patient', function ($pq) use ($search) {
                $pq->where('name', 'like', "%{$search}%")
                   ->orWhere('patient_number', 'like', "%{$search}%");
            });
        }

        $query->orderBy('expected_end_date', 'asc');

        $sessions = $query->paginate($request->integer('per_page', 15));

        // Append computed attributes for frontend
        $sessions->getCollection()->transform(function ($session) {
            $today = \Carbon\Carbon::today();
            $expectedEnd = \Carbon\Carbon::parse($session->expected_end_date);
            $daysRemaining = (int) $today->diffInDays($expectedEnd, false);

            $session->is_approaching_end = $session->status === 'active' && $daysRemaining <= 7;
            $session->days_remaining = $daysRemaining;
            return $session;
        });

        return response()->json($sessions);
    }
}
