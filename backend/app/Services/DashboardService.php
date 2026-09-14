<?php

namespace App\Services;

use App\Models\Admission;
use App\Models\Appointment;
use App\Models\GuardianMessage;
use App\Models\Invoice;
use App\Models\MedicationAdministration;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\TreatmentSession;
use App\Models\User;
use Carbon\Carbon;

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
}
