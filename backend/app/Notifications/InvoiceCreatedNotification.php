<?php

namespace App\Notifications;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvoiceCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Invoice $invoice;

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $patientName = $this->invoice->patient?->name ?? 'Your Family Member';
        $patientNumber = $this->invoice->patient?->patient_number ?? '';
        $amount = number_format((float) $this->invoice->amount, 2);
        $dueDate = $this->invoice->due_date ? $this->invoice->due_date->format('M d, Y') : 'Upon receipt';

        $sessionInfo = $this->invoice->treatmentSession
            ? "Treatment Session #{$this->invoice->treatmentSession->session_number}"
            : "Residential Care";

        $mailMessage = (new MailMessage)
            ->subject("Payment Notice: Invoice {$this->invoice->invoice_number} - Rehab Center")
            ->greeting("Hello {$notifiable->name},")
            ->line("An invoice has been generated for **{$patientName}** ({$patientNumber}) regarding **{$sessionInfo}**.")
            ->line("Invoice Number: **{$this->invoice->invoice_number}**")
            ->line("Total Amount: **NGN {$amount}**")
            ->line("Due Date: **{$dueDate}**");

        if ($this->invoice->notes) {
            $mailMessage->line("Note: {$this->invoice->notes}");
        }

        $mailMessage->line("Please contact our front-desk reception or make a payment using your registered reference.")
            ->line("Thank you for your continued support in the rehabilitation journey.");

        return $mailMessage;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'invoice_id' => $this->invoice->id,
            'invoice_number' => $this->invoice->invoice_number,
            'amount' => $this->invoice->amount,
            'due_date' => $this->invoice->due_date,
            'patient_id' => $this->invoice->patient_id,
        ];
    }
}
