<?php

namespace App\Notifications;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Payment $payment;
    public Invoice $invoice;

    public function __construct(Payment $payment, Invoice $invoice)
    {
        $this->payment = $payment;
        $this->invoice = $invoice;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $patientName = $this->invoice->patient?->name ?? 'Your Family Member';
        $paidAmount = number_format((float) $this->payment->amount, 2);
        $remainingBalance = number_format((float) $this->invoice->balance, 2);
        $statusText = strtoupper(str_replace('_', ' ', $this->invoice->status));

        $mailMessage = (new MailMessage)
            ->subject("Payment Receipt: {$this->payment->reference} - Rehab Center")
            ->greeting("Hello {$notifiable->name},")
            ->line("We have received and verified a payment for **{$patientName}**.")
            ->line("Payment Reference: **{$this->payment->reference}**")
            ->line("Amount Paid: **NGN {$paidAmount}**")
            ->line("Payment Method: **" . ucfirst($this->payment->method) . "**")
            ->line("Invoice Number: **{$this->invoice->invoice_number}**")
            ->line("Invoice Status: **{$statusText}**")
            ->line("Remaining Balance: **NGN {$remainingBalance}**");

        if ($this->invoice->isPaid()) {
            $mailMessage->line("This invoice is now **fully paid**. Thank you!");
        }

        $mailMessage->line("Thank you for your prompt payment.");

        return $mailMessage;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'payment_id' => $this->payment->id,
            'payment_reference' => $this->payment->reference,
            'amount' => $this->payment->amount,
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'balance' => $this->invoice->balance,
            'patient_id' => $this->invoice->patient_id,
        ];
    }
}
