<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientDoctorAssignment;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientDoctorAssignmentController extends Controller
{
    /**
     * List all doctor assignments (active and historical) for a patient.
     */
    public function index(Patient $patient): JsonResponse
    {
        $user = auth()->user();
        if (!$user || (!$user->isAdmin() && !$user->isDoctor())) {
            abort(403, 'Unauthorized access to assignment history.');
        }

        $assignments = $patient->doctorAssignments()
            ->with(['doctor.staffProfile', 'assignedBy'])
            ->latest('assigned_at')
            ->get();

        return response()->json([
            'data' => $assignments,
            'active_assignment' => $assignments->firstWhere('status', 'active'),
        ]);
    }

    /**
     * Assign or reassign a primary doctor to a patient (Admin only).
     */
    public function store(Request $request, Patient $patient): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json([
                'message' => 'Only administrators can assign or reassign doctors.',
            ], 403);
        }

        $validated = $request->validate([
            'doctor_id' => ['required', 'integer', 'exists:users,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $doctor = User::with('roles')->findOrFail($validated['doctor_id']);
        if (!$doctor->isDoctor()) {
            return response()->json([
                'message' => 'The selected staff member does not have the Doctor role.',
                'errors' => [
                    'doctor_id' => ['Selected user is not a certified doctor.'],
                ],
            ], 422);
        }

        $assignment = DB::transaction(function () use ($patient, $doctor, $user, $validated) {
            // Close any existing active assignment for this patient
            PatientDoctorAssignment::where('patient_id', $patient->id)
                ->where('status', 'active')
                ->update([
                    'status' => 'inactive',
                    'unassigned_at' => now(),
                ]);

            // Create new active persistent assignment
            return PatientDoctorAssignment::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'assigned_by' => $user->id,
                'assigned_at' => now(),
                'status' => 'active',
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        return response()->json([
            'message' => 'Doctor assigned successfully.',
            'data' => $assignment->load(['doctor.staffProfile', 'assignedBy']),
        ], 201);
    }

    /**
     * Get list of all available doctors for assignment selection.
     */
    public function doctors(): JsonResponse
    {
        $doctors = User::whereHas('roles', function ($query) {
            $query->where('name', Role::DOCTOR);
        })
        ->where('status', 'active')
        ->with('staffProfile')
        ->orderBy('name')
        ->get(['id', 'name', 'email', 'phone', 'status']);

        return response()->json([
            'data' => $doctors,
        ]);
    }
}
