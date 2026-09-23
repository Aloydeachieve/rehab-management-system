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
            if (! $guardian) {
                continue;
            }

            $patient = $pair->patient_id ? Patient::find($pair->patient_id) : null;

            // Apply search filter if provided
            if ($search) {
                $searchLower = strtolower($search);
                $matchesGuardian = str_contains(strtolower($guardian->name ?? ''), $searchLower)
                    || str_contains(strtolower($guardian->email ?? ''), $searchLower)
                    || str_contains(strtolower($guardian->phone ?? ''), $searchLower);
                
                $matchesPatient = false;
                if ($patient) {
                    $matchesPatient = str_contains(strtolower($patient->name ?? ''), $searchLower)
                        || str_contains(strtolower($patient->patient_number ?? ''), $searchLower);
                } else {
                    $matchesPatient = str_contains('not linked pending unlinked', $searchLower);
                }

                if (! $matchesGuardian && ! $matchesPatient) {
                    continue;
                }
            }

            $msgQuery = GuardianMessage::where('guardian_id', $pair->guardian_id);
            if ($pair->patient_id) {
                $msgQuery->where('patient_id', $pair->patient_id);
            } else {
                $msgQuery->whereNull('patient_id');
            }

            $latestMsg = (clone $msgQuery)->latest('created_at')->first();

            $unreadCount = (clone $msgQuery)
                ->whereNull('sender_user_id') // incoming from guardian
                ->whereNull('read_at')
                ->count();

            $isLinked = $guardian->isLinked() && $patient !== null;

            $conversations[] = [
                'guardian_id' => $guardian->id,
                'guardian_name' => $guardian->name,
                'guardian_email' => $guardian->email,
                'guardian_phone' => $guardian->phone,
                'relationship' => $isLinked ? ($guardian->relationship ?? 'Not specified') : 'Support User',
                'is_linked' => $isLinked,
                'patient_id' => $isLinked ? $patient?->id : null,
                'patient_number' => $isLinked ? $patient?->patient_number : null,
                'patient_name' => $isLinked ? $patient->name : 'Patient not yet linked',
                'patient_status' => $isLinked ? $patient?->status : null,
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
     * Display the full message history directly by guardian (supports linked and unlinked guardians).
     */
    public function guardianConversation(Request $request, Guardian $guardian): JsonResponse
    {
        $patient = ($guardian->isLinked() && $guardian->patient_id) ? Patient::find($guardian->patient_id) : null;

        $messages = GuardianMessage::with(['senderUser', 'guardian'])
            ->where('guardian_id', $guardian->id)
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
            'patient' => $patient ? [
                'id' => $patient->id,
                'patient_number' => $patient->patient_number,
                'name' => $patient->name,
                'status' => $patient->status,
            ] : null,
            'guardian' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'email' => $guardian->email,
                'phone' => $guardian->phone,
                'relationship' => $guardian->isLinked() ? ($guardian->relationship ?? 'Not specified') : 'Support User',
                'is_linked' => $guardian->isLinked(),
            ],
            'messages' => $formatted,
        ]);
    }

    /**
     * Reply directly to a guardian (linked or unlinked).
     */
    public function replyGuardian(Request $request, Guardian $guardian): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $message = GuardianMessage::create([
            'patient_id' => $guardian->isLinked() ? $guardian->patient_id : null,
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
     * Mark all unread messages from a guardian as read.
     */
    public function markGuardianConversationAsRead(Request $request, Guardian $guardian): JsonResponse
    {
        $count = GuardianMessage::where('guardian_id', $guardian->id)
            ->whereNull('sender_user_id')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'message' => "Marked {$count} messages as read.",
            'updated_count' => $count,
        ]);
    }

    /**
     * Link an unlinked guardian to a patient with a selected relationship.
     */
    public function linkPatient(Request $request, Guardian $guardian): JsonResponse
    {
        $data = $request->validate([
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'relationship' => ['required', 'string', 'max:50'],
        ]);

        $patient = Patient::findOrFail($data['patient_id']);

        // Check duplicate: is this guardian already linked to this patient?
        if ($guardian->is_verified && $guardian->patient_id === $patient->id) {
            return response()->json([
                'message' => 'Guardian is already linked to this patient.',
            ], 422);
        }

        // Check if another guardian with same email is already linked and verified for this patient
        if ($guardian->email) {
            $existingLink = Guardian::where('email', $guardian->email)
                ->where('patient_id', $patient->id)
                ->where('is_verified', true)
                ->where('id', '!=', $guardian->id)
                ->first();
            if ($existingLink) {
                return response()->json([
                    'message' => 'A guardian profile with this email is already linked to this patient.',
                ], 422);
            }

            // Clean up any unverified intake placeholder records for this patient and email
            Guardian::where('email', $guardian->email)
                ->where('patient_id', $patient->id)
                ->where('id', '!=', $guardian->id)
                ->where('is_verified', false)
                ->whereNull('password')
                ->delete();
        }

        // Update guardian
        $guardian->patient_id = $patient->id;
        $guardian->relationship = trim($data['relationship']);
        $guardian->is_verified = true;
        $guardian->save();

        // Link any previous unlinked messages from this guardian to this patient
        GuardianMessage::where('guardian_id', $guardian->id)
            ->whereNull('patient_id')
            ->update(['patient_id' => $patient->id]);

        return response()->json([
            'message' => "Guardian {$guardian->name} successfully linked to patient {$patient->name} ({$patient->patient_number}).",
            'guardian' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'email' => $guardian->email,
                'phone' => $guardian->phone,
                'relationship' => $guardian->relationship,
                'is_linked' => true,
            ],
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'patient_number' => $patient->patient_number,
                'status' => $patient->status,
            ],
        ]);
    }

    /**
     * Unlink a guardian from a patient without deleting conversation history.
     */
    public function unlinkPatient(Request $request, Guardian $guardian): JsonResponse
    {
        if (! $guardian->patient_id) {
            return response()->json([
                'message' => 'Guardian is not linked to any patient.',
            ], 422);
        }

        $patient = Patient::find($guardian->patient_id);
        $patientName = $patient ? $patient->name : 'patient';

        // Unlink the guardian
        // Messages remain intact in guardian_messages with their existing patient_id for audit history
        $guardian->patient_id = null;
        $guardian->is_verified = false;
        $guardian->save();

        return response()->json([
            'message' => "Guardian {$guardian->name} unlinked from {$patientName}. Messages and history have been preserved.",
            'guardian' => [
                'id' => $guardian->id,
                'name' => $guardian->name,
                'email' => $guardian->email,
                'phone' => $guardian->phone,
                'relationship' => $guardian->relationship,
                'is_linked' => false,
            ],
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
