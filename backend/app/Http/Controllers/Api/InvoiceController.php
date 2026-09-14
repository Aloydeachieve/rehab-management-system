<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\TreatmentSession;
use App\Notifications\InvoiceCreatedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvoiceController extends Controller
{
    /**
     * Display a listing of invoices.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with(['patient', 'treatmentSession', 'payments'])->latest();

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

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('from_date')) {
            $query->whereDate('due_date', '>=', $request->from_date);
        }

        if ($request->filled('to_date')) {
            $query->whereDate('due_date', '<=', $request->to_date);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Store a newly created invoice for a patient / treatment session.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'treatment_session_id' => ['nullable', 'integer', 'exists:treatment_sessions,id'],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'due_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        if (empty($data['treatment_session_id']) && empty($data['amount'])) {
            return response()->json([
                'message' => 'The amount field is required when no treatment session is selected.',
                'errors' => [
                    'amount' => ['The amount field is required.'],
                ],
            ], 422);
        }

        $patient = Patient::findOrFail($data['patient_id']);
        $session = null;

        if (! empty($data['treatment_session_id'])) {
            $session = TreatmentSession::where('id', $data['treatment_session_id'])
                ->where('patient_id', $patient->id)
                ->first();

            if (! $session) {
                return response()->json([
                    'message' => 'The selected treatment session does not belong to this patient.',
                    'errors' => [
                        'treatment_session_id' => ['The selected treatment session does not belong to this patient.'],
                    ],
                ], 422);
            }

            // Prevent duplicate active invoices for the same session
            $existingActive = Invoice::where('treatment_session_id', $data['treatment_session_id'])
                ->whereNotIn('status', [Invoice::STATUS_CANCELLED])
                ->exists();

            if ($existingActive) {
                return response()->json([
                    'message' => 'An active invoice already exists for this treatment session.',
                    'errors' => [
                        'treatment_session_id' => ['An active invoice already exists for this treatment session.'],
                    ],
                ], 422);
            }
        }

        $invoice = DB::transaction(function () use ($data, $request, $session) {
            $year = now()->year;
            $count = Invoice::whereYear('created_at', $year)->lockForUpdate()->count() + 1;
            $invoiceNumber = 'INV-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);

            while (Invoice::where('invoice_number', $invoiceNumber)->exists()) {
                $count++;
                $invoiceNumber = 'INV-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);
            }

            // Use provided amount or fallback to configured session price
            if (isset($data['amount']) && $data['amount'] !== null && $data['amount'] !== '') {
                $amount = round((float) $data['amount'], 2);
            } elseif ($session) {
                $amount = round((float) ($session->session_price ?? app(\App\Services\TreatmentPricingService::class)->getPriceForSessionNumber($session->session_number)), 2);
            } else {
                $amount = 0.00;
            }

            $invoice = Invoice::create([
                'patient_id' => $data['patient_id'],
                'treatment_session_id' => $data['treatment_session_id'] ?? null,
                'invoice_number' => $invoiceNumber,
                'amount' => $amount,
                'amount_paid' => 0.00,
                'balance' => $amount,
                'due_date' => $data['due_date'],
                'status' => Invoice::STATUS_UNPAID,
                'notes' => $data['notes'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            if ($invoice->treatment_session_id && $invoice->treatmentSession) {
                $invoice->treatmentSession->update(['payment_status' => 'unpaid']);
            }

            return $invoice;
        });

        // Notify primary guardian if available
        try {
            $primaryGuardian = $patient->guardians()->where('is_primary', true)->first()
                ?? $patient->guardians()->whereNotNull('email')->first();

            if ($primaryGuardian && $primaryGuardian->email) {
                $primaryGuardian->notify(new InvoiceCreatedNotification($invoice));
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to send invoice notification to guardian: {$e->getMessage()}");
        }

        return response()->json([
            'message' => 'Invoice created successfully.',
            'invoice' => $invoice->load(['patient', 'treatmentSession']),
        ], 201);
    }

    /**
     * Display the specified invoice with payments history and patient details.
     */
    public function show(Invoice $invoice): JsonResponse
    {
        $invoice->load([
            'patient.guardians',
            'treatmentSession',
            'payments.recordedByUser',
            'creator',
        ]);

        return response()->json([
            'invoice' => $invoice,
        ]);
    }
}
