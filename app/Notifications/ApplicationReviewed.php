<?php

namespace App\Notifications;

use App\Models\StudentIdApplication;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationReviewed extends Notification
{
    public function __construct(
        public StudentIdApplication $application,
        public string $outcome,
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)->subject('Your student ID application: '.$this->outcome);

        if ($this->outcome === 'approved') {
            return $mail
                ->greeting('Hello '.$notifiable->name.',')
                ->line('Your student ID application was approved. Your digital ID is now available in your portal.')
                ->action('Open my digital ID', url('/portal/id'));
        }

        return $mail
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your student ID application was not approved.')
            ->line('Reason: '.$this->application->rejection_reason)
            ->action('Review my application', url('/portal/profile'));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'application_id' => $this->application->id,
            'outcome' => $this->outcome,
            // Only the student-visible reason is ever included; never internal notes.
            'reason' => $this->outcome === 'rejected' ? $this->application->rejection_reason : null,
        ];
    }
}
