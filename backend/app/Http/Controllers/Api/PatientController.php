<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PatientController extends Controller
{
    /**
     * Display a listing of the patients (Staff only).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $query = Patient::with(['guardians', 'admissions'])->latest();

        if ($user->isDoctor()) {
            $query->whereHas('appointments', function ($q) use ($user) {
                $q->where('assigned_staff_id', $user->id);
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('patient_number', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Store a newly registered patient and their primary guardian (Admin/Receptionist only).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            // Patient details
            'name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', 'string', 'max:50'],
            'address' => ['required', 'string'],
            'phone' => ['nullable', 'string', 'max:25'],
            
            // Primary Guardian details
            'guardian_name' => ['required', 'string', 'max:255'],
            'guardian_relationship' => ['required', 'string', 'max:100'],
            'guardian_phone' => ['required', 'string', 'max:25'],
            'guardian_email' => ['nullable', 'email', 'max:255'],
            'guardian_address' => ['nullable', 'string'],
        ]);

        $patient = DB::transaction(function () use ($data) {
            // Generate unique patient number: RC-YYYY-XXXXX
            $year = now()->year;
            $count = Patient::whereYear('created_at', $year)->lockForUpdate()->count() + 1;
            $patientNumber = 'RC-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);

            // Double check uniqueness
            while (Patient::where('patient_number', $patientNumber)->exists()) {
                $count++;
                $patientNumber = 'RC-' . $year . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);
            }

            // Create patient
            $patient = Patient::create([
                'patient_number' => $patientNumber,
                'name' => $data['name'],
                'date_of_birth' => $data['date_of_birth'],
                'gender' => $data['gender'],
                'address' => $data['address'],
                'phone' => $data['phone'] ?? null,
                'status' => 'active',
            ]);

            // Create primary guardian
            Guardian::create([
                'patient_id' => $patient->id,
                'name' => $data['guardian_name'],
                'relationship' => $data['guardian_relationship'],
                'phone' => $data['guardian_phone'],
                'email' => $data['guardian_email'] ?? null,
                'address' => $data['guardian_address'] ?? null,
                'is_primary' => true,
            ]);

            return $patient;
        });

        return response()->json([
            'message' => 'Patient registered successfully.',
            'patient' => $patient->load('guardians'),
        ], 201);
    }

    /**
     * Display the specified patient profile, guardians and admissions logs (Staff only).
     */
    public function show(Patient $patient): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        if ($user->isDoctor()) {
            $isAssigned = $patient->appointments()
                ->where('assigned_staff_id', $user->id)
                ->exists();

            if (!$isAssigned) {
                abort(403, 'You are not assigned/authorized to access this patient\'s profile.');
            }
        }

        $patient->load(['guardians', 'admissions.admittedBy']);
        return response()->json(['patient' => $patient]);
    }

    /**
     * Update patient demographic details.
     */
    public function update(Request $request, Patient $patient): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before_or_equal:today'],
            'gender' => ['required', 'string', 'max:50'],
            'address' => ['required', 'string'],
            'phone' => ['nullable', 'string', 'max:25'],
            'status' => ['required', 'string', 'max:50'],
        ]);

        $patient->update($data);

        return response()->json([
            'message' => 'Patient profile updated successfully.',
            'patient' => $patient->load('guardians'),
        ]);
    }

    /**
     * Retrieve the list of guardians for the patient.
     */
    public function guardians(Patient $patient): JsonResponse
    {
        /** @var \App\Models\User $user */
        $user = auth()->user();

        if ($user->isDoctor()) {
            $isAssigned = $patient->appointments()
                ->where('assigned_staff_id', $user->id)
                ->exists();

            if (! $isAssigned) {
                abort(403, 'You are not assigned/authorized to access this patient\'s guardians.');
            }
        }

        return response()->json([
            'guardians' => $patient->guardians,
        ]);
    }
}
