<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\GuardianMessage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GuardianMessageController extends Controller
{
    /**
     * Display message history for the authenticated guardian and their selected linked patient.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var Guardian $guardian */
        $guardian = $request->user();
        $accessiblePatientIds = $guardian->accessiblePatients()->pluck('id')->toArray();

        $patientId = $request->input('patient_id');

        if ($patientId) {
            if (! in_array((int) $patientId, $accessiblePatientIds, true)) {
                return response()->json([
                    'message' => 'You are not authorized to view messages for this patient.',
                ], 403);
            }
            $selectedPatientId = (int) $patientId;
        } else {
            $selectedPatientId = $guardian->patient_id ?? ($accessiblePatientIds[0] ?? null);
        }

        if (! $selectedPatientId) {
            return response()->json([
                'messages' => [],
                'patient_id' => null,
            ]);
        }

        $guardianIds = Guardian::where('email', $guardian->email)
            ->whereNotNull('email')
            ->pluck('id')
            ->push($guardian->id)
            ->unique();

        $messages = GuardianMessage::with(['senderUser'])
            ->where('patient_id', $selectedPatientId)
            ->whereIn('guardian_id', $guardianIds)
            ->orderBy('created_at', 'asc')
            ->get();

        $formatted = $messages->map(function (GuardianMessage $msg) use ($guardian) {
            return [
                'id' => $msg->id,
                'patient_id' => $msg->patient_id,
                'guardian_id' => $msg->guardian_id,
                'sender_user_id' => $msg->sender_user_id,
                'sender_type' => $msg->isFromStaff() ? 'staff' : 'guardian',
                'sender_name' => $msg->isFromStaff()
                    ? ($msg->senderUser?->name ?? 'Receptionist')
                    : $guardian->name,
                'message' => $msg->message,
                'read_at' => $msg->read_at,
                'created_at' => $msg->created_at,
            ];
        });

        return response()->json([
            'patient_id' => $selectedPatientId,
            'messages' => $formatted,
        ]);
    }

    /**
     * Send a support message from the authenticated guardian regarding a linked patient.
     */
    public function store(Request $request): JsonResponse
    {
        /** @var Guardian $guardian */
        $guardian = $request->user();

        $data = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $accessiblePatientIds = $guardian->accessiblePatients()->pluck('id')->toArray();

        if (! in_array((int) $data['patient_id'], $accessiblePatientIds, true)) {
            return response()->json([
                'message' => 'You are not authorized to communicate regarding this patient.',
            ], 403);
        }

        $message = GuardianMessage::create([
            'patient_id' => $data['patient_id'],
            'guardian_id' => $guardian->id,
            'sender_user_id' => null, // null indicates sent by guardian
            'message' => trim($data['message']),
            'read_at' => null,
        ]);

        return response()->json([
            'message' => 'Message sent successfully.',
            'data' => [
                'id' => $message->id,
                'patient_id' => $message->patient_id,
                'guardian_id' => $message->guardian_id,
                'sender_type' => 'guardian',
                'sender_name' => $guardian->name,
                'message' => $message->message,
                'read_at' => $message->read_at,
                'created_at' => $message->created_at,
            ],
        ], 201);
    }

    /**
     * Mark a staff reply as read by the guardian.
     */
    public function markAsRead(Request $request, GuardianMessage $message): JsonResponse
    {
        /** @var Guardian $guardian */
        $guardian = $request->user();
        $accessiblePatientIds = $guardian->accessiblePatients()->pluck('id')->toArray();

        if (! in_array($message->patient_id, $accessiblePatientIds, true)) {
            return response()->json([
                'message' => 'You are not authorized to update this message.',
            ], 403);
        }

        // Guardian can mark staff messages as read
        if ($message->isFromStaff() && ! $message->read_at) {
            $message->update(['read_at' => now()]);
        }

        return response()->json([
            'message' => 'Message marked as read.',
            'data' => $message,
        ]);
    }

    /**
     * Check receptionist availability / support status.
     */
    public function supportStatus(): JsonResponse
    {
        // Derived support availability: online if an active receptionist/admin was active in the last 4 hours
        $hasActiveStaff = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['receptionist', 'admin']);
        })
        ->where('status', 'active')
        ->where('last_login_at', '>=', now()->subHours(4))
        ->exists();

        return response()->json([
            'is_online' => $hasActiveStaff,
            'status_message' => $hasActiveStaff
                ? 'Support is currently online. A receptionist is available to help.'
                : 'Support is currently offline. Leave a message and our receptionist will respond when available.',
            'working_hours' => 'Monday - Saturday: 8:00 AM - 6:00 PM',
        ]);
    }
}
