<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Notifications\AppointmentStatusChanged;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class AppointmentController extends Controller
{
    /**
     * Display a listing of the appointments (Staff only).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        if ($user->isDoctor()) {
            // Doctors can only see appointments assigned to them
            $query = Appointment::with('assignedStaff')
                ->where('assigned_staff_id', $user->id)
                ->latest();
        } elseif ($user->isAdmin() || $user->isReceptionist()) {
            $query = Appointment::with('assignedStaff')->latest();
        } else {
            abort(403, 'You are not authorized to view appointments.');
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('visitor_name', 'like', "%{$search}%")
                  ->orWhere('visitor_phone', 'like', "%{$search}%")
                  ->orWhere('visitor_email', 'like', "%{$search}%");
            });
        }

        return AppointmentResource::collection($query->paginate(15));
    }

    /**
     * Store a newly created appointment request in storage (Public access).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'visitor_name' => ['required', 'string', 'max:255'],
            'visitor_phone' => ['required', 'string', 'max:25'],
            'visitor_email' => ['nullable', 'email', 'max:255'],
            'reason' => ['required', 'string'],
            'preferred_at' => ['required', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string'],
        ]);

        $appointment = Appointment::create(array_merge($data, [
            'status' => Appointment::STATUS_PENDING,
        ]));

        if ($appointment->visitor_email) {
            try {
                Notification::route('mail', $appointment->visitor_email)
                    ->notify(new AppointmentStatusChanged($appointment));
            } catch (\Throwable $e) {
                Log::error("Failed to send public booking email: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Appointment request submitted successfully.',
            'appointment' => new AppointmentResource($appointment),
        ], 201);
    }

    /**
     * Display the specified appointment (Staff only).
     */
    public function show(Appointment $appointment): AppointmentResource
    {
        $user = auth()->user();

        if ($user->isDoctor()) {
            if ($appointment->assigned_staff_id !== $user->id) {
                abort(403, 'You are not authorized to view this appointment.');
            }
        } elseif (!$user->isAdmin() && !$user->isReceptionist()) {
            abort(403, 'You are not authorized to view this appointment.');
        }

        $appointment->load('assignedStaff');
        return new AppointmentResource($appointment);
    }

    /**
     * Approve the appointment request.
     */
    public function approve(Request $request, Appointment $appointment): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $appointment->update([
            'status' => Appointment::STATUS_APPROVED,
            'notes' => $request->notes ?? $appointment->notes,
        ]);

        $this->notifyVisitor($appointment);

        return response()->json([
            'message' => 'Appointment approved successfully.',
            'appointment' => new AppointmentResource($appointment),
        ]);
    }

    /**
     * Reject the appointment request.
     */
    public function reject(Request $request, Appointment $appointment): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $appointment->update([
            'status' => Appointment::STATUS_REJECTED,
            'notes' => $request->notes ?? $appointment->notes,
        ]);

        $this->notifyVisitor($appointment);

        return response()->json([
            'message' => 'Appointment rejected.',
            'appointment' => new AppointmentResource($appointment),
        ]);
    }

    /**
     * Reschedule the appointment.
     */
    public function reschedule(Request $request, Appointment $appointment): JsonResponse
    {
        $request->validate([
            'scheduled_at' => ['required', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string'],
        ]);

        $appointment->update([
            'status' => Appointment::STATUS_RESCHEDULED,
            'scheduled_at' => $request->scheduled_at,
            'notes' => $request->notes ?? $appointment->notes,
        ]);

        $this->notifyVisitor($appointment);

        return response()->json([
            'message' => 'Appointment rescheduled successfully.',
            'appointment' => new AppointmentResource($appointment),
        ]);
    }

    /**
     * Complete the appointment.
     */
    public function complete(Request $request, Appointment $appointment): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $appointment->update([
            'status' => Appointment::STATUS_COMPLETED,
            'notes' => $request->notes ?? $appointment->notes,
        ]);

        $this->notifyVisitor($appointment);

        return response()->json([
            'message' => 'Appointment marked as completed.',
            'appointment' => new AppointmentResource($appointment),
        ]);
    }

    /**
     * Cancel the appointment.
     */
    public function cancel(Request $request, Appointment $appointment): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $appointment->update([
            'status' => Appointment::STATUS_CANCELLED,
            'notes' => $request->notes ?? $appointment->notes,
        ]);

        $this->notifyVisitor($appointment);

        return response()->json([
            'message' => 'Appointment cancelled.',
            'appointment' => new AppointmentResource($appointment),
        ]);
    }

    /**
     * Send status update email notification to the visitor.
     */
    private function notifyVisitor(Appointment $appointment): void
    {
        if ($appointment->visitor_email) {
            try {
                Notification::route('mail', $appointment->visitor_email)
                    ->notify(new AppointmentStatusChanged($appointment));
            } catch (\Throwable $e) {
                Log::error("Failed to send status update email: " . $e->getMessage());
            }
        }
    }
}
