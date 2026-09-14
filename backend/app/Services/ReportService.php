<?php

namespace App\Services;

use App\Models\Admission;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\MedicationAdministration;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\TreatmentSession;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

class ReportService
{
    /**
     * Patient and Admission Report.
     */
    public function getPatientsReport(Request $request): LengthAwarePaginator
    {
        $query = Patient::with([
            'admissions' => fn ($q) => $q->latest('admission_date'),
            'treatmentSessions' => fn ($q) => $q->where('status', 'active'),
        ]);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('patient_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('from_date')) {
            $query->whereHas('admissions', function ($aq) use ($request) {
                $aq->whereDate('admission_date', '>=', $request->from_date);
            });
        }

        if ($request->filled('to_date')) {
            $query->whereHas('admissions', function ($aq) use ($request) {
                $aq->whereDate('admission_date', '<=', $request->to_date);
            });
        }

        $paginator = $query->latest()->paginate($request->integer('per_page', 15));

        $paginator->getCollection()->transform(function ($patient) {
            $latestAdmission = $patient->admissions->first();
            $currentSession = $patient->treatmentSessions->first();

            return [
                'id' => $patient->id,
                'patient_name' => $patient->name,
                'patient_number' => $patient->patient_number,
                'gender' => $patient->gender,
                'status' => $patient->status,
                'admission_date' => $latestAdmission?->admission_date?->toDateString(),
                'admission_type' => $latestAdmission?->admission_type,
                'current_session_number' => $currentSession?->session_number,
                'current_session_status' => $currentSession?->status,
            ];
        });

        return $paginator;
    }

    /**
     * Treatment Session Report.
     */
    public function getTreatmentSessionsReport(Request $request): LengthAwarePaginator
    {
        $query = TreatmentSession::with(['patient', 'professional']);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('practitioner_id')) {
            $query->where('professional_id', $request->practitioner_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('patient', function ($pq) use ($search) {
                $pq->where('name', 'like', "%{$search}%")
                   ->orWhere('patient_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('start_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('start_date', '<=', $request->to_date);
        }

        $paginator = $query->latest('start_date')->paginate($request->integer('per_page', 15));

        $paginator->getCollection()->transform(function ($session) {
            return [
                'id' => $session->id,
                'patient_id' => $session->patient_id,
                'patient_name' => $session->patient?->name,
                'patient_number' => $session->patient?->patient_number,
                'session_number' => $session->session_number,
                'session_price' => $session->session_price,
                'start_date' => $session->start_date?->toDateString(),
                'expected_end_date' => $session->expected_end_date?->toDateString(),
                'actual_end_date' => $session->actual_end_date?->toDateString(),
                'status' => $session->status,
                'payment_status' => $session->payment_status,
                'assigned_practitioner' => $session->professional?->name ?? 'Unassigned',
                'recommendation' => $session->recommendation,
            ];
        });

        return $paginator;
    }

    /**
     * Billing / Invoices Report.
     */
    public function getBillingReport(Request $request): array
    {
        $query = Invoice::with(['patient', 'treatmentSession']);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('patient', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%")
                         ->orWhere('patient_number', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('due_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('due_date', '<=', $request->to_date);
        }

        // Calculate summary aggregations over the filtered set
        $summaryQuery = clone $query;
        $totalAmount = round((float) $summaryQuery->sum('amount'), 2);
        $totalPaid = round((float) $summaryQuery->sum('amount_paid'), 2);
        $totalBalance = round((float) $summaryQuery->sum('balance'), 2);

        $paginator = $query->latest('due_date')->paginate($request->integer('per_page', 15));

        $paginator->getCollection()->transform(function ($invoice) {
            return [
                'id' => $invoice->id,
                'invoice_number' => $invoice->invoice_number,
                'patient_id' => $invoice->patient_id,
                'patient_name' => $invoice->patient?->name,
                'patient_number' => $invoice->patient?->patient_number,
                'session_number' => $invoice->treatmentSession?->session_number,
                'amount' => $invoice->amount,
                'amount_paid' => $invoice->amount_paid,
                'balance' => $invoice->balance,
                'status' => $invoice->status,
                'due_date' => $invoice->due_date?->toDateString(),
                'created_at' => $invoice->created_at->toDateString(),
            ];
        });

        return [
            'paginator' => $paginator,
            'summary' => [
                'total_amount' => $totalAmount,
                'total_paid' => $totalPaid,
                'total_balance' => $totalBalance,
            ],
        ];
    }

    /**
     * Payment Report.
     */
    public function getPaymentsReport(Request $request): array
    {
        $query = Payment::with(['patient', 'invoice', 'recordedByUser']);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('method') && $request->method !== 'all') {
            $query->where('method', $request->method);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('patient', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%")
                         ->orWhere('patient_number', 'like', "%{$search}%");
                  })
                  ->orWhereHas('invoice', function ($iq) use ($search) {
                      $iq->where('invoice_number', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        $summaryQuery = clone $query;
        $totalCollected = round((float) $summaryQuery->where('status', Payment::STATUS_SUCCESSFUL)->sum('amount'), 2);
        $totalTransactions = $summaryQuery->count();

        $paginator = $query->latest()->paginate($request->integer('per_page', 15));

        $paginator->getCollection()->transform(function ($payment) {
            return [
                'id' => $payment->id,
                'reference' => $payment->reference,
                'invoice_number' => $payment->invoice?->invoice_number,
                'patient_id' => $payment->patient_id,
                'patient_name' => $payment->patient?->name,
                'patient_number' => $payment->patient?->patient_number,
                'amount' => $payment->amount,
                'method' => $payment->method,
                'status' => $payment->status,
                'paid_at' => $payment->paid_at ? $payment->paid_at->toIso8601String() : $payment->created_at->toIso8601String(),
                'recorded_by' => $payment->recordedByUser?->name ?? 'System / Webhook',
            ];
        });

        return [
            'paginator' => $paginator,
            'summary' => [
                'total_collected' => $totalCollected,
                'total_transactions' => $totalTransactions,
            ],
        ];
    }

    /**
     * Medication Administration Report (Admin Only - Clinical Record).
     */
    public function getMedicationsReport(Request $request): LengthAwarePaginator
    {
        $query = MedicationAdministration::with(['patient', 'prescriptionItem', 'administeringStaff']);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('patient', function ($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%")
                       ->orWhere('patient_number', 'like', "%{$search}%");
                })->orWhereHas('prescriptionItem', function ($piq) use ($search) {
                    $piq->where('medication_name', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('scheduled_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('scheduled_at', '<=', $request->to_date);
        }

        $paginator = $query->latest('scheduled_at')->paginate($request->integer('per_page', 15));

        $paginator->getCollection()->transform(function ($admin) {
            return [
                'id' => $admin->id,
                'patient_id' => $admin->patient_id,
                'patient_name' => $admin->patient?->name,
                'patient_number' => $admin->patient?->patient_number,
                'medication_name' => $admin->prescriptionItem?->medication_name,
                'dosage' => $admin->prescriptionItem?->dosage,
                'scheduled_at' => $admin->scheduled_at?->toIso8601String(),
                'status' => $admin->status,
                'administered_at' => $admin->administered_at?->toIso8601String(),
                'administering_staff' => $admin->administeringStaff?->name ?? 'N/A',
                'notes' => $admin->notes,
            ];
        });

        return $paginator;
    }

    /**
     * Appointment Report.
     */
    public function getAppointmentsReport(Request $request): LengthAwarePaginator
    {
        $query = Appointment::with(['patient', 'assignedStaff']);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('assigned_staff_id')) {
            $query->where('assigned_staff_id', $request->assigned_staff_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('visitor_name', 'like', "%{$search}%")
                  ->orWhere('visitor_phone', 'like', "%{$search}%")
                  ->orWhere('visitor_email', 'like', "%{$search}%")
                  ->orWhereHas('patient', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%")
                         ->orWhere('patient_number', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('from_date')) {
            $query->whereDate('preferred_at', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('preferred_at', '<=', $request->to_date);
        }

        $paginator = $query->latest('preferred_at')->paginate($request->integer('per_page', 15));

        $paginator->getCollection()->transform(function ($appointment) {
            return [
                'id' => $appointment->id,
                'visitor_name' => $appointment->visitor_name,
                'patient_name' => $appointment->patient?->name,
                'patient_number' => $appointment->patient?->patient_number,
                'visitor_phone' => $appointment->visitor_phone,
                'visitor_email' => $appointment->visitor_email,
                'reason' => $appointment->reason,
                'appointment_date' => $appointment->scheduled_at ? $appointment->scheduled_at->toIso8601String() : $appointment->preferred_at?->toIso8601String(),
                'assigned_staff' => $appointment->assignedStaff?->name ?? 'Unassigned',
                'status' => $appointment->status,
            ];
        });

        return $paginator;
    }
}
