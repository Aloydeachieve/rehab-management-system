<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;
use App\Notifications\PaymentReceivedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PaymentController extends Controller
{
    /**
     * Display a listing of recorded payments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['patient', 'invoice', 'recordedByUser'])->latest();

        if ($request->filled('invoice_id')) {
            $query->where('invoice_id', $request->invoice_id);
        }

        if ($request->filled('patient_id')) {
            $query->where('patient_id', $request->patient_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
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

        return response()->json($query->paginate(15));
    }

    /**
     * Record a new verified payment against an invoice.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'invoice_id' => ['required', 'integer', 'exists:invoices,id'],
            'patient_id' => ['nullable', 'integer', 'exists:patients,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'string', 'in:cash,bank_transfer,card,pos,cheque'],
            'reference' => ['nullable', 'string', 'max:100'],
            'provider' => ['nullable', 'string', 'max:50'],
            'provider_reference' => ['nullable', 'string', 'max:100'],
            'paid_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $invoice = Invoice::findOrFail($data['invoice_id']);

        if (! empty($data['patient_id']) && (int) $data['patient_id'] !== $invoice->patient_id) {
            return response()->json([
                'message' => 'The specified patient does not match this invoice.',
                'errors' => [
                    'patient_id' => ['The specified patient does not match this invoice.'],
                ],
            ], 422);
        }

        if ($invoice->status === Invoice::STATUS_CANCELLED) {
            return response()->json([
                'message' => 'Cannot record payment for a cancelled invoice.',
                'errors' => [
                    'invoice_id' => ['Cannot record payment for a cancelled invoice.'],
                ],
            ], 422);
        }

        $paymentAmount = round((float) $data['amount'], 2);

        if ($paymentAmount > (float) $invoice->balance) {
            return response()->json([
                'message' => "Payment amount (NGN " . number_format($paymentAmount, 2) . ") exceeds the remaining invoice balance of NGN " . number_format($invoice->balance, 2) . ".",
                'errors' => [
                    'amount' => ["Payment amount exceeds remaining balance of NGN " . number_format($invoice->balance, 2) . "."],
                ],
            ], 422);
        }

        if (! empty($data['reference']) && Payment::where('reference', $data['reference'])->exists()) {
            return response()->json([
                'message' => 'A payment with this reference already exists.',
                'errors' => [
                    'reference' => ['A payment with this reference already exists.'],
                ],
            ], 422);
        }

        $result = DB::transaction(function () use ($data, $invoice, $paymentAmount, $request) {
            // Lock invoice record for atomic balance update
            $lockedInvoice = Invoice::where('id', $invoice->id)->lockForUpdate()->first();

            $reference = ! empty($data['reference'])
                ? $data['reference']
                : 'PAY-' . date('Ymd') . '-' . strtoupper(Str::random(8));

            $payment = Payment::create([
                'patient_id' => $lockedInvoice->patient_id,
                'invoice_id' => $lockedInvoice->id,
                'reference' => $reference,
                'amount' => $paymentAmount,
                'method' => $data['method'],
                'provider' => $data['provider'] ?? 'manual',
                'provider_reference' => $data['provider_reference'] ?? null,
                'status' => Payment::STATUS_SUCCESSFUL,
                'paid_at' => $data['paid_at'] ?? now(),
                'notes' => $data['notes'] ?? null,
                'recorded_by' => $request->user()?->id,
            ]);

            $lockedInvoice->recalculateBalanceAndStatus();

            return [
                'payment' => $payment,
                'invoice' => $lockedInvoice->fresh(['patient', 'treatmentSession']),
            ];
        });

        // Send payment confirmation notification to guardian
        try {
            $patient = $invoice->patient;
            $primaryGuardian = $patient?->guardians()->where('is_primary', true)->first()
                ?? $patient?->guardians()->whereNotNull('email')->first();

            if ($primaryGuardian && $primaryGuardian->email) {
                $primaryGuardian->notify(new PaymentReceivedNotification($result['payment'], $result['invoice']));
            }
        } catch (\Throwable $e) {
            Log::warning("Failed to send payment receipt notification to guardian: {$e->getMessage()}");
        }

        return response()->json([
            'message' => 'Payment recorded successfully.',
            'payment' => $result['payment'],
            'invoice' => $result['invoice'],
        ], 201);
    }

    /**
     * Provider-agnostic payment gateway webhook handler with idempotency.
     */
    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->all();

        // Extract reference and event status from various provider webhook formats
        $reference = $payload['reference']
            ?? $payload['data']['reference']
            ?? $payload['tx_ref']
            ?? $payload['id']
            ?? null;

        $event = $payload['event'] ?? $payload['status'] ?? 'charge.success';

        if (! $reference) {
            return response()->json(['message' => 'Missing transaction reference in payload.'], 400);
        }

        // Check if payment already exists
        $payment = Payment::where('reference', $reference)->first();

        if ($payment && $payment->status === Payment::STATUS_SUCCESSFUL) {
            return response()->json([
                'status' => 'success',
                'message' => 'Payment has already been processed idempotently.',
            ], 200);
        }

        if ($payment) {
            // Update existing pending payment
            DB::transaction(function () use ($payment, $payload) {
                $payment->update([
                    'status' => Payment::STATUS_SUCCESSFUL,
                    'paid_at' => now(),
                    'provider_reference' => $payload['provider_reference'] ?? $payment->provider_reference,
                ]);

                $payment->invoice->recalculateBalanceAndStatus();
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Payment status updated to successful.',
            ], 200);
        }

        // If payment record was not pre-created, check if invoice is specified in metadata
        $invoiceId = $payload['metadata']['invoice_id']
            ?? $payload['data']['metadata']['invoice_id']
            ?? null;

        $amount = (float) ($payload['amount'] ?? $payload['data']['amount'] ?? 0);

        if ($invoiceId && $amount > 0) {
            $invoice = Invoice::find($invoiceId);

            if ($invoice) {
                DB::transaction(function () use ($invoice, $reference, $amount, $payload) {
                    $payment = Payment::create([
                        'patient_id' => $invoice->patient_id,
                        'invoice_id' => $invoice->id,
                        'reference' => $reference,
                        'amount' => $amount,
                        'method' => 'card',
                        'provider' => $payload['provider'] ?? 'gateway',
                        'provider_reference' => $payload['provider_reference'] ?? $reference,
                        'status' => Payment::STATUS_SUCCESSFUL,
                        'paid_at' => now(),
                        'notes' => 'Processed via webhook callback.',
                    ]);

                    $invoice->recalculateBalanceAndStatus();
                });

                return response()->json([
                    'status' => 'success',
                    'message' => 'Payment created and invoice updated.',
                ], 200);
            }
        }

        return response()->json([
            'status' => 'ignored',
            'message' => 'Webhook received but no matching invoice found.',
        ], 200);
    }
}
