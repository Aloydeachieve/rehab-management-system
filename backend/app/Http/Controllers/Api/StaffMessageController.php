<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\GuardianMessage;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffMessageController extends Controller
{
    /**
     * Display a listing of guardian support conversations for receptionists and admins.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');

        // Query distinct conversation pairs (guardian_id, patient_id) with latest activity
        $query = GuardianMessage::select('guardian_id', 'patient_id', DB::raw('MAX(created_at) as latest_activity_at'))
            ->groupBy('guardian_id', 'patient_id')
            ->orderBy('latest_activity_at', 'desc');

        $conversationPairs = $query->get();

        $conversations = [];

        foreach ($conversationPairs as $pair) {
            $guardian = Guardian::find($pair->guardian_id);
            $patient = Patient::find($pair->patient_id);

            if (! $guardian || ! $patient) {
                continue;
            }

            // Apply search filter if provided
            if ($search) {
                $searchLower = strtolower($search);
                $matchesGuardian = str_contains(strtolower($guardian->name), $searchLower)
                    || str_contains(strtolower($guardian->email ?? ''), $searchLower)
                    || str_contains(strtolower($guardian->phone ?? ''), $searchLower);
                $matchesPatient = str_contains(strtolower($patient->name), $searchLower)
                    || str_contains(strtolower($patient->patient_number), $searchLower);

                if (! $matchesGuardian && ! $matchesPatient) {
                    continue;
                }
            }

            $latestMsg = GuardianMessage::where('guardian_id', $pair->guardian_id)
                ->where('patient_id', $pair->patient_id)
                ->latest('created_at')
                ->first();

            $unreadCount = GuardianMessage::where('guardian_id', $pair->guardian_id)
                ->where('patient_id', $pair->patient_id)
                ->whereNull('sender_user_id') // incoming from guardian
                ->whereNull('read_at')
                ->count();

            $conversations[] = [
                'guardian_id' => $guardian->id,
                'guardian_name' => $guardian->name,
                'guardian_email' => $guardian->email,
                'guardian_phone' => $guardian->phone,
                'relationship' => $guardian->relationship,
                'patient_id' => $patient->id,
                'patient_number' => $patient->patient_number,
                'patient_name' => $patient->name,
                'patient_status' => $patient->status,
                'unread_count' => $unreadCount,
                'latest_activity_at' => $pair->latest_activity_at,
                'latest_message' => $latestMsg ? [
                    'id' => $latestMsg->id,
                    'message' => $latestMsg->message,
                    'sender_type' => $latestMsg->isFromStaff() ? 'staff' : 'guardian',
                    'read_at' => $latestMsg->read_at,
                    'created_at' => $latestMsg->created_at,
                ] : null,
            ];
        }

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    /**
     * Display the full message history between a guardian and the center for a specific patient.
     */
    public function conversation(Request $request, Patient $patient): JsonResponse
    {
        $guardianId = $request->query('guardian_id');

        if ($guardianId) {
            $guardian = Guardian::where('id', $guardianId)
                ->where('patient_id', $patient->id)
                ->first();

            if (! $guardian) {
                // Also check if guardian exists by email
                $guardian = Guardian::where('id', $guardianId)->first();
            }
        } else {
            $guardian = $patient->guardians()->where('is_primary', true)->first()
                ?? $patient->guardians()->first();
        }

        if (! $guardian) {
            return response()->json([
                'patient' => [
                    'id' => $patient->id,
                    'patient_number' => $patient->patient_number,
                    'name' => $patient->name,
                ],
                'guardian' => null,
                'messages' => [],
            ]);
        }

        $guardianIds = Guardian::where('email', $guardian->email)
            ->whereNotNull('email')
            ->pluck('id')
            ->push($guardian->id)
            ->unique();

        $messages = GuardianMessage::with(['senderUser', 'guardian'])
            ->where('patient_id', $patient->id)
            ->whereIn('guardian_id', $guardianIds)
            ->orderBy('created_at', 'asc')
            ->get();

        $formatted = $messages->map(function (GuardianMessage $msg) {
            return [
                'id' => $msg->id,
                'patient_id' => $msg->patient_id,
                'guardian_id' => $msg->guardian_id,
                'sender_user_id' => $msg->sender_user_id,
                'sender_type' => $msg->isFromStaff() ? 'staff' : 'guardian',
                'sender_name' => $msg->isFromStaff()
                    ? ($msg->senderUser?->name ?? 'Receptionist')
                    : ($msg->guardian?->name ?? 'Guardian'),
                'message' => $msg->message,
                'read_at' => $msg->read_at,
                'created_at' => $msg->created_at,
            ];
        });

        return response()->json([
            'patient' => [
                'id' => $patient->id,
                'patient_number' => $patient->patient_number,
                'name' => $patient->name,
                'status' => $patient->status,
            ],
            'guardian' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'email' => $guardian->email,
                'phone' => $guardian->phone,
                'relationship' => $guardian->relationship,
            ],
            'messages' => $formatted,
        ]);
    }

    /**
     * Reply to a guardian regarding a patient.
     */
    public function reply(Request $request, Patient $patient): JsonResponse
    {
        $data = $request->validate([
            'guardian_id' => ['required', 'integer', 'exists:guardians,id'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $guardian = Guardian::where('id', $data['guardian_id'])->first();

        // Verify guardian is linked to patient
        $isLinked = Guardian::where('id', $data['guardian_id'])
            ->where('patient_id', $patient->id)
            ->exists() || ($guardian && $guardian->accessiblePatients()->contains('id', $patient->id));

        if (! $isLinked) {
            return response()->json([
                'message' => 'The selected guardian is not associated with this patient.',
            ], 422);
        }

        $message = GuardianMessage::create([
            'patient_id' => $patient->id,
            'guardian_id' => $guardian->id,
            'sender_user_id' => $request->user()->id,
            'message' => trim($data['message']),
            'read_at' => null,
        ]);

        return response()->json([
            'message' => 'Reply sent successfully.',
            'data' => [
                'id' => $message->id,
                'patient_id' => $message->patient_id,
                'guardian_id' => $message->guardian_id,
                'sender_user_id' => $message->sender_user_id,
                'sender_type' => 'staff',
                'sender_name' => $request->user()->name,
                'message' => $message->message,
                'read_at' => $message->read_at,
                'created_at' => $message->created_at,
            ],
        ], 201);
    }

    /**
     * Mark an incoming guardian message as read by staff.
     */
    public function markAsRead(Request $request, GuardianMessage $message): JsonResponse
    {
        if ($message->isFromGuardian() && ! $message->read_at) {
            $message->update(['read_at' => now()]);
        }

        return response()->json([
            'message' => 'Message marked as read.',
            'data' => $message,
        ]);
    }

    /**
     * Mark all unread incoming guardian messages in a conversation as read.
     */
    public function markConversationAsRead(Request $request, Patient $patient): JsonResponse
    {
        $guardianId = $request->input('guardian_id');

        $query = GuardianMessage::where('patient_id', $patient->id)
            ->whereNull('sender_user_id')
            ->whereNull('read_at');

        if ($guardianId) {
            $query->where('guardian_id', $guardianId);
        }

        $count = $query->update(['read_at' => now()]);

        return response()->json([
            'message' => "Marked {$count} messages as read.",
            'updated_count' => $count,
        ]);
    }
}
