<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'visitor_name' => $this->visitor_name,
            'visitor_phone' => $this->visitor_phone,
            'visitor_email' => $this->visitor_email,
            'reason' => $this->reason,
            'preferred_at' => $this->preferred_at?->toIso8601String(),
            'scheduled_at' => $this->scheduled_at?->toIso8601String(),
            'assigned_staff_id' => $this->assigned_staff_id,
            'assigned_staff' => $this->assignedStaff ? [
                'id' => $this->assignedStaff->id,
                'name' => $this->assignedStaff->name,
                'email' => $this->assignedStaff->email,
            ] : null,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
