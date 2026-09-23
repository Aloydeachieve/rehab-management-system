<?php

namespace App\Services;

use App\Models\Admission;
use App\Models\Appointment;
use App\Models\Assessment;
use App\Models\ClinicalNote;
use App\Models\GuardianMessage;
use App\Models\Invoice;
use App\Models\MedicationAdministration;
use App\Models\Patient;
use App\Models\PatientDoctorAssignment;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\TreatmentSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardService
{
    /**
     * Compile high-level operational and administrative summary statistics.
     */
    public function getSummary(User $user): array
    {
        $today = Carbon::today();

        // 1. Patient metrics
        $patientsData = [
            'total_registered' => Patient::count(),
            'currently_admitted' => Admission::where('status', 'active')->count(),
            'active_sessions' => TreatmentSession::where('status', 'active')->count(),
            'discharged' => Patient::where('status', 'discharged')->count(),
        ];

        // 2. Appointment metrics
        $appointmentsData = [
            'pending' => Appointment::where('status', Appointment::STATUS_PENDING)->count(),
            'approved' => Appointment::where('status', Appointment::STATUS_APPROVED)->count(),
            'today' => Appointment::whereDate('scheduled_at', $today)->count(),
            'completed' => Appointment::where('status', Appointment::STATUS_COMPLETED)->count(),
        ];

        // 3. Billing metrics (Admin & Receptionist)
        $billingData = [
            'total_invoiced' => round((float) Invoice::where('status', '!=', Invoice::STATUS_CANCELLED)->sum('amount'), 2),
            'total_collected' => round((float) Payment::where('status', Payment::STATUS_SUCCESSFUL)->sum('amount'), 2),
            'outstanding_balance' => round((float) Invoice::whereIn('status', [
                Invoice::STATUS_UNPAID,
                Invoice::STATUS_PARTIALLY_PAID,
                Invoice::STATUS_OVERDUE,
            ])->sum('balance'), 2),
            'partially_paid_count' => Invoice::where('status', Invoice::STATUS_PARTIALLY_PAID)->count(),
            'overdue_count' => Invoice::where('status', Invoice::STATUS_OVERDUE)
                ->orWhere(function ($q) use ($today) {
                    $q->whereNotIn('status', [Invoice::STATUS_PAID, Invoice::STATUS_CANCELLED])
                      ->whereDate('due_date', '<', $today);
                })->count(),
        ];

        // 4. Medication eMAR metrics
        $medicationsData = [
            'today_scheduled' => MedicationAdministration::whereDate('scheduled_at', $today)->count(),
            'today_given' => MedicationAdministration::whereDate('scheduled_at', $today)->where('status', 'given')->count(),
            'today_missed' => MedicationAdministration::whereDate('scheduled_at', $today)->where('status', 'missed')->count(),
            'today_refused' => MedicationAdministration::whereDate('scheduled_at', $today)->where('status', 'refused')->count(),
            'today_cancelled' => MedicationAdministration::whereDate('scheduled_at', $today)->where('status', 'cancelled')->count(),
        ];

        // 5. Guardian communications
        $unreadMessagesCount = GuardianMessage::whereNull('sender_user_id')
            ->whereNull('read_at')
            ->count();

        $totalConversations = GuardianMessage::select('guardian_id', 'patient_id')
            ->distinct()
            ->count();

        $guardiansData = [
            'total_conversations' => $totalConversations,
            'unread_messages' => $unreadMessagesCount,
        ];

        return [
            'patients' => $patientsData,
            'appointments' => $appointmentsData,
            'billing' => $billingData,
            'medications' => $medicationsData,
            'guardians' => $guardiansData,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Compile operational alerts and action-required items.
     */
    public function getAlerts(User $user): array
    {
        $alerts = [];
        $today = Carbon::today();
        $isReceptionist = $user->isReceptionist() && ! $user->isAdmin();

        // 1. Pending Appointments (Operational)
        $pendingAppointments = Appointment::with('patient')
            ->where('status', Appointment::STATUS_PENDING)
            ->latest()
            ->limit(5)
            ->get();

        foreach ($pendingAppointments as $appointment) {
            $alerts[] = [
                'id' => 'appt-' . $appointment->id,
                'category' => 'appointments',
                'type' => 'pending_appointment',
                'title' => 'Pending Appointment Request',
                'description' => "Visitor {$appointment->visitor_name} requested appointment for " . ($appointment->preferred_at ? Carbon::parse($appointment->preferred_at)->format('M d, Y h:i A') : 'TBD'),
                'severity' => 'medium',
                'action_url' => '/dashboard/appointments',
                'action_label' => 'Review',
                'created_at' => $appointment->created_at->toIso8601String(),
                'meta' => [
                    'appointment_id' => $appointment->id,
                    'visitor_name' => $appointment->visitor_name,
                ],
            ];
        }

        // 2. Overdue Invoices (Operational & Financial)
        $overdueInvoices = Invoice::with('patient')
            ->whereNotIn('status', [Invoice::STATUS_PAID, Invoice::STATUS_CANCELLED])
            ->where(function ($q) use ($today) {
                $q->where('status', Invoice::STATUS_OVERDUE)
                  ->orWhereDate('due_date', '<', $today);
            })
            ->latest('due_date')
            ->limit(5)
            ->get();

        foreach ($overdueInvoices as $invoice) {
            $alerts[] = [
                'id' => 'inv-' . $invoice->id,
                'category' => 'billing',
                'type' => 'overdue_invoice',
                'title' => "Overdue Invoice: {$invoice->invoice_number}",
                'description' => "Patient {$invoice->patient?->name} has an overdue balance of ₦" . number_format((float) $invoice->balance, 2) . " (Due {$invoice->due_date?->format('M d, Y')})",
                'severity' => 'high',
                'action_url' => '/dashboard/billing',
                'action_label' => 'View Ledger',
                'created_at' => $invoice->created_at->toIso8601String(),
                'meta' => [
                    'invoice_id' => $invoice->id,
                    'balance' => $invoice->balance,
                ],
            ];
        }

        // 3. Unread Guardian Messages (Communications)
        $unreadMessages = GuardianMessage::with(['patient', 'guardian'])
            ->whereNull('sender_user_id')
            ->whereNull('read_at')
            ->latest()
            ->limit(5)
            ->get();

        foreach ($unreadMessages as $msg) {
            $alerts[] = [
                'id' => 'msg-' . $msg->id,
                'category' => 'messages',
                'type' => 'unread_message',
                'title' => "Unread Guardian Message: {$msg->guardian?->name}",
                'description' => "Regarding patient {$msg->patient?->name}: \"" . \Illuminate\Support\Str::limit($msg->message, 60) . "\"",
                'severity' => 'medium',
                'action_url' => '/dashboard/messages',
                'action_label' => 'Reply',
                'created_at' => $msg->created_at->toIso8601String(),
                'meta' => [
                    'patient_id' => $msg->patient_id,
                    'guardian_id' => $msg->guardian_id,
                ],
            ];
        }

        // 4. Treatment sessions approaching expected end date (≤ 7 days)
        $expiringSessions = TreatmentSession::with('patient')
            ->where('status', 'active')
            ->whereDate('expected_end_date', '<=', $today->copy()->addDays(7)->toDateString())
            ->orderBy('expected_end_date', 'asc')
            ->limit(5)
            ->get();

        foreach ($expiringSessions as $session) {
            $daysRemaining = (int) $today->diffInDays(Carbon::parse($session->expected_end_date), false);
            $isOverdue = $daysRemaining < 0;

            $alerts[] = [
                'id' => 'session-exp-' . $session->id,
                'category' => 'sessions',
                'type' => 'session_expiring',
                'title' => "Session #{$session->session_number} " . ($isOverdue ? 'End Date Passed' : 'Ending Soon'),
                'description' => "Patient {$session->patient?->name} ({$session->patient?->patient_number}) - " . ($isOverdue ? abs($daysRemaining) . " days overdue for decision" : "{$daysRemaining} days remaining until scheduled end date ({$session->expected_end_date})"),
                'severity' => $isOverdue ? 'high' : 'medium',
                'action_url' => "/dashboard/sessions/{$session->id}",
                'action_label' => 'View Session',
                'created_at' => $session->updated_at->toIso8601String(),
                'meta' => [
                    'session_id' => $session->id,
                    'days_remaining' => $daysRemaining,
                ],
            ];
        }

        // 5. Clinical Decision Required (Admin only - Receptionists excluded)
        if (! $isReceptionist) {
            $sessionsNeedingDecision = TreatmentSession::with(['patient', 'reassessedByUser'])
                ->where('status', 'active')
                ->whereNotNull('recommendation')
                ->whereNull('decision_at')
                ->limit(5)
                ->get();

            foreach ($sessionsNeedingDecision as $session) {
                $alerts[] = [
                    'id' => 'session-dec-' . $session->id,
                    'category' => 'clinical',
                    'type' => 'session_decision_required',
                    'title' => 'Treatment Continuation / Discharge Decision Needed',
                    'description' => "Dr. {$session->reassessedByUser?->name} recommended {$session->recommendation} for {$session->patient?->name} (Session #{$session->session_number}).",
                    'severity' => 'high',
                    'action_url' => "/dashboard/sessions/{$session->id}",
                    'action_label' => 'Make Decision',
                    'created_at' => ($session->reassessed_at ?? $session->updated_at)->toIso8601String(),
                    'meta' => [
                        'session_id' => $session->id,
                        'recommendation' => $session->recommendation,
                    ],
                ];
            }

            // 6. Missed / Refused Medication Today (Admin / Clinical)
            $problematicMeds = MedicationAdministration::with(['patient', 'prescriptionItem'])
                ->whereDate('scheduled_at', $today)
                ->whereIn('status', ['missed', 'refused'])
                ->latest()
                ->limit(5)
                ->get();

            foreach ($problematicMeds as $med) {
                $alerts[] = [
                    'id' => 'med-' . $med->id,
                    'category' => 'medications',
                    'type' => 'missed_medication',
                    'title' => "Medication " . ucfirst($med->status) . ": {$med->prescriptionItem?->medication_name}",
                    'description' => "Patient {$med->patient?->name} dosage was marked as {$med->status}." . ($med->notes ? " Note: {$med->notes}" : ''),
                    'severity' => 'high',
                    'action_url' => '/dashboard/medications',
                    'action_label' => 'View eMAR',
                    'created_at' => $med->updated_at->toIso8601String(),
                    'meta' => [
                        'patient_id' => $med->patient_id,
                        'status' => $med->status,
                    ],
                ];
            }
        }

        return $alerts;
    }

    /**
     * Compile clinical statistics and assigned patient workspace data for doctors.
     */
    public function getDoctorSummary(User $doctor): array
    {
        $today = Carbon::today();

        // Retrieve all patient IDs assigned to this doctor
        $assignedPatientIds = PatientDoctorAssignment::where('doctor_id', $doctor->id)
            ->where('status', 'active')
            ->pluck('patient_id')
            ->merge(
                Appointment::where('assigned_staff_id', $doctor->id)
                    ->whereNotNull('patient_id')
                    ->pluck('patient_id')
            )
            ->unique();

        $activePatientsCount = Patient::whereIn('id', $assignedPatientIds)
            ->where('status', 'active')
            ->count();

        $sessionsEndingSoonCount = TreatmentSession::whereIn('patient_id', $assignedPatientIds)
            ->where('status', 'active')
            ->whereDate('expected_end_date', '<=', $today->copy()->addDays(7))
            ->count();

        $pendingReassessmentsCount = TreatmentSession::whereIn('patient_id', $assignedPatientIds)
            ->where('status', 'active')
            ->whereNull('reassessed_at')
            ->whereDate('expected_end_date', '<=', $today->copy()->addDays(7))
            ->count();

        $recentObservationsCount = ClinicalNote::whereIn('patient_id', $assignedPatientIds)
            ->where('created_at', '>=', $today->copy()->subDays(7)->startOfDay())
            ->count();

        // Fetch detailed assigned patients
        $patients = Patient::whereIn('id', $assignedPatientIds)
            ->with([
                'treatmentSessions' => fn($q) => $q->latest('session_number'),
                'clinicalNotes' => fn($q) => $q->with('practitioner')->latest(),
                'assessments' => fn($q) => $q->latest(),
                'prescriptions' => fn($q) => $q->where('status', 'active'),
            ])
            ->latest()
            ->get();

        $assignedPatientsData = [];
        $reviewCount = 0;

        foreach ($patients as $patient) {
            $activeSession = $patient->treatmentSessions->firstWhere('status', 'active');
            $daysRemaining = null;
            $isEndingSoon = false;

            if ($activeSession) {
                $days = Carbon::today()->diffInDays(Carbon::parse($activeSession->expected_end_date), false);
                $daysRemaining = max(0, $days);
                $isEndingSoon = $days <= 7;
            }

            $lastNote = $patient->clinicalNotes->first();
            $lastAssessment = $patient->assessments->first();
            $activePrescriptionsCount = $patient->prescriptions->count();

            // Today's med stats for this patient
            $todayMeds = MedicationAdministration::where('patient_id', $patient->id)
                ->whereDate('scheduled_at', $today)
                ->get();

            $todayGiven = $todayMeds->where('status', 'given')->count();
            $todayMissed = $todayMeds->whereIn('status', ['missed', 'refused'])->count();
            $todayTotal = $todayMeds->count();

            // Determine if requires review
            $requiresReview = false;
            $alertMessage = null;

            if ($isEndingSoon && $activeSession && !$activeSession->reassessed_at) {
                $requiresReview = true;
                $alertMessage = "Reassessment required ({$daysRemaining} days remaining)";
            } elseif ($todayMissed > 0) {
                $requiresReview = true;
                $alertMessage = "{$todayMissed} dose(s) missed/refused today";
            } elseif ($lastNote && in_array(strtolower($lastNote->note_type), ['medication reaction', 'behaviour', 'significant concern'])) {
                $requiresReview = true;
                $alertMessage = "Recent concern: {$lastNote->note_type}";
            }

            if ($requiresReview) {
                $reviewCount++;
            }

            $assignedPatientsData[] = [
                'id' => $patient->id,
                'patient_number' => $patient->patient_number,
                'name' => $patient->name,
                'gender' => $patient->gender,
                'date_of_birth' => $patient->date_of_birth,
                'status' => $patient->status,
                'active_session' => $activeSession ? [
                    'id' => $activeSession->id,
                    'session_number' => $activeSession->session_number,
                    'status' => $activeSession->status,
                    'payment_status' => $activeSession->payment_status,
                    'start_date' => $activeSession->start_date,
                    'expected_end_date' => $activeSession->expected_end_date,
                    'days_remaining' => $daysRemaining,
                    'is_ending_soon' => $isEndingSoon,
                    'reassessed_at' => $activeSession->reassessed_at?->toIso8601String(),
                ] : null,
                'last_observation' => $lastNote ? [
                    'id' => $lastNote->id,
                    'note_type' => $lastNote->note_type,
                    'content' => $lastNote->content,
                    'recorded_at' => $lastNote->recorded_at?->toIso8601String() ?? $lastNote->created_at->toIso8601String(),
                    'practitioner_name' => $lastNote->practitioner?->name,
                ] : null,
                'last_assessment' => $lastAssessment ? [
                    'id' => $lastAssessment->id,
                    'assessment_type' => $lastAssessment->assessment_type,
                    'recorded_at' => $lastAssessment->recorded_at?->toIso8601String() ?? $lastAssessment->created_at->toIso8601String(),
                ] : null,
                'active_prescriptions_count' => $activePrescriptionsCount,
                'today_medications' => [
                    'total' => $todayTotal,
                    'given' => $todayGiven,
                    'missed' => $todayMissed,
                ],
                'alert' => $alertMessage,
            ];
        }

        return [
            'doctor_name' => $doctor->name,
            'statistics' => [
                'active_patients' => $activePatientsCount,
                'patients_requiring_review' => $reviewCount,
                'sessions_ending_soon' => $sessionsEndingSoonCount,
                'pending_reassessments' => $pendingReassessmentsCount,
                'recent_observations' => $recentObservationsCount,
            ],
            'patients' => $assignedPatientsData,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Compute visual analytics and period breakdown metrics.
     */
    public function getAnalytics(Request $request): array
    {
        $period = $request->query('period', 'this_month');
        $now = Carbon::now();

        if ($period === 'prev_month') {
            $startDate = $now->copy()->subMonth()->startOfMonth();
            $endDate = $now->copy()->subMonth()->endOfMonth();
        } elseif ($period === '3_months') {
            $startDate = $now->copy()->subMonths(2)->startOfMonth();
            $endDate = $now->copy()->endOfMonth();
        } elseif ($period === '6_months') {
            $startDate = $now->copy()->subMonths(5)->startOfMonth();
            $endDate = $now->copy()->endOfMonth();
        } else { // this_month
            $startDate = $now->copy()->startOfMonth();
            $endDate = $now->copy()->endOfMonth();
        }

        // 1. Patient Monthly Activity
        $activityData = [];
        $cursor = $startDate->copy()->startOfMonth();
        while ($cursor->lte($endDate)) {
            $monthStart = $cursor->copy()->startOfMonth();
            $monthEnd = $cursor->copy()->endOfMonth();

            $registrations = Patient::whereBetween('created_at', [$monthStart, $monthEnd])->count();
            $admissions = Admission::whereBetween('admission_date', [$monthStart->toDateString(), $monthEnd->toDateString()])->count();

            $activityData[] = [
                'month' => $cursor->format('M Y'),
                'registrations' => $registrations,
                'admissions' => $admissions,
            ];
            $cursor->addMonth();
        }

        // 2. Revenue Breakdown
        $invoicesQuery = Invoice::where('status', '!=', Invoice::STATUS_CANCELLED)
            ->whereBetween('created_at', [$startDate, $endDate]);

        $totalInvoiced = (float) $invoicesQuery->sum('amount');
        
        $totalCollected = (float) Payment::where('status', Payment::STATUS_SUCCESSFUL)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('amount');

        $outstandingBalance = (float) Invoice::whereIn('status', [
                Invoice::STATUS_UNPAID,
                Invoice::STATUS_PARTIALLY_PAID,
                Invoice::STATUS_OVERDUE,
            ])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('balance');

        $overdueBalance = (float) Invoice::where(function ($q) use ($now) {
                $q->where('status', Invoice::STATUS_OVERDUE)
                  ->orWhere(function ($sub) use ($now) {
                      $sub->whereNotIn('status', [Invoice::STATUS_PAID, Invoice::STATUS_CANCELLED])
                          ->whereDate('due_date', '<', $now);
                  });
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->sum('balance');

        $revenueBreakdown = [
            'total_invoiced' => round($totalInvoiced, 2),
            'total_collected' => round($totalCollected, 2),
            'outstanding_balance' => round($outstandingBalance, 2),
            'overdue_balance' => round($overdueBalance, 2),
            'chart_data' => [
                ['name' => 'Collected', 'value' => round($totalCollected, 2), 'color' => '#2F7D5B'],
                ['name' => 'Outstanding', 'value' => round(max(0, $outstandingBalance - $overdueBalance), 2), 'color' => '#D97706'],
                ['name' => 'Overdue', 'value' => round($overdueBalance, 2), 'color' => '#DC2626'],
            ],
        ];

        // 3. Appointments
        $appts = Appointment::whereBetween('created_at', [$startDate, $endDate])->get();
        $appointmentsData = [
            'pending' => $appts->where('status', Appointment::STATUS_PENDING)->count(),
            'approved' => $appts->where('status', Appointment::STATUS_APPROVED)->count(),
            'completed' => $appts->where('status', Appointment::STATUS_COMPLETED)->count(),
            'cancelled' => $appts->where('status', Appointment::STATUS_CANCELLED)->count(),
            'total' => $appts->count(),
            'chart_data' => [
                ['name' => 'Pending', 'value' => $appts->where('status', Appointment::STATUS_PENDING)->count(), 'color' => '#F59E0B'],
                ['name' => 'Approved', 'value' => $appts->where('status', Appointment::STATUS_APPROVED)->count(), 'color' => '#3B82F6'],
                ['name' => 'Completed', 'value' => $appts->where('status', Appointment::STATUS_COMPLETED)->count(), 'color' => '#2F7D5B'],
                ['name' => 'Cancelled', 'value' => $appts->where('status', Appointment::STATUS_CANCELLED)->count(), 'color' => '#9CA3AF'],
            ],
        ];

        // 4. Medication Administrations
        $meds = MedicationAdministration::whereBetween('scheduled_at', [$startDate, $endDate])->get();
        $medicationsData = [
            'scheduled' => $meds->where('status', 'scheduled')->count(),
            'given' => $meds->where('status', 'given')->count(),
            'missed' => $meds->where('status', 'missed')->count(),
            'refused' => $meds->where('status', 'refused')->count(),
            'cancelled' => $meds->where('status', 'cancelled')->count(),
            'total' => $meds->count(),
            'chart_data' => [
                ['name' => 'Given', 'value' => $meds->where('status', 'given')->count(), 'color' => '#2F7D5B'],
                ['name' => 'Scheduled', 'value' => $meds->where('status', 'scheduled')->count(), 'color' => '#60A5FA'],
                ['name' => 'Missed', 'value' => $meds->where('status', 'missed')->count(), 'color' => '#EF4444'],
                ['name' => 'Refused', 'value' => $meds->where('status', 'refused')->count(), 'color' => '#F59E0B'],
            ],
        ];

        return [
            'period' => $period,
            'range' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
            ],
            'patient_activity' => $activityData,
            'revenue_breakdown' => $revenueBreakdown,
            'appointments' => $appointmentsData,
            'medications' => $medicationsData,
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
