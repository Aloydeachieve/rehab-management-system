<?php

namespace App\Notifications;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppointmentStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    protected $appointment;

    /**
     * Create a new notification instance.
     */
    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $status = ucfirst($this->appointment->status);
        $preferredAt = $this->appointment->preferred_at->format('M d, Y @ h:i A');
        $scheduledAt = $this->appointment->scheduled_at ? $this->appointment->scheduled_at->format('M d, Y @ h:i A') : 'N/A';

        $mailMessage = (new MailMessage)
            ->subject("Appointment Update - Rehab Center")
            ->greeting("Hello {$this->appointment->visitor_name},")
            ->line("Your appointment request status has been updated to: **{$status}**.");

        if ($this->appointment->status === Appointment::STATUS_APPROVED) {
            $mailMessage->line("We are pleased to confirm your appointment at the center.")
                ->line("Preferred Date/Time: {$preferredAt}");
        } elseif ($this->appointment->status === Appointment::STATUS_RESCHEDULED) {
            $mailMessage->line("Your appointment has been rescheduled.")
                ->line("New Scheduled Date/Time: **{$scheduledAt}**");
        } elseif ($this->appointment->status === Appointment::STATUS_REJECTED) {
            $mailMessage->line("Unfortunately, we are unable to accept your appointment request at this time.");
        }

        if ($this->appointment->notes) {
            $mailMessage->line("Staff Note: {$this->appointment->notes}");
        }

        $mailMessage->line("If you have any questions, please contact us at the center.")
            ->line("Thank you for choosing our rehabilitation center.");

        return $mailMessage;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'appointment_id' => $this->appointment->id,
            'status' => $this->appointment->status,
            'visitor_name' => $this->appointment->visitor_name,
        ];
    }
}
