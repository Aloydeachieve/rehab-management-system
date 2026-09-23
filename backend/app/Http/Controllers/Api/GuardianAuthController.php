<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Patient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class GuardianAuthController extends Controller
{
    /**
     * Guardian login. Issues a Sanctum API token for guardian communication.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $guardians = Guardian::where('email', $request->email)->get();

        $guardian = $guardians->first(function ($g) use ($request) {
            return $g->password && Hash::check($request->password, $g->password);
        });

        if (! $guardian) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($guardian->status !== 'active') {
            return response()->json(['message' => 'This guardian account is not active.'], 403);
        }

        $guardian->forceFill(['last_login_at' => now()])->save();

        $token = $guardian->createToken('guardian', ['guardian'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'guardian' => $this->guardianPayload($guardian),
        ]);
    }

    /**
     * Guardian account activation/registration using verified patient number and email on file.
     */
    public function activate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'patient_number' => ['nullable', 'string'],
            'name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $hashedPassword = Hash::make($data['password']);

        // Option A: Guardian provided a patient registration number
        if (!empty($data['patient_number'])) {
            $patient = Patient::where('patient_number', $data['patient_number'])->first();

            if (! $patient) {
                throw ValidationException::withMessages([
                    'patient_number' => ['No patient record found matching the provided patient ID.'],
                ]);
            }

            $guardian = Guardian::where('patient_id', $patient->id)
                ->where('email', $data['email'])
                ->first();

            if (! $guardian) {
                // If a guardian account exists with this email, link to this patient
                $existingGuardian = Guardian::where('email', $data['email'])->first();
                if ($existingGuardian && is_null($existingGuardian->patient_id)) {
                    $existingGuardian->update([
                        'patient_id' => $patient->id,
                        'password' => $hashedPassword,
                        'is_verified' => true,
                        'status' => 'active',
                        'last_login_at' => now(),
                    ]);
                    $guardian = $existingGuardian;
                } else {
                    throw ValidationException::withMessages([
                        'email' => ['No guardian record matching this email is registered for the specified patient.'],
                    ]);
                }
            } else {
                // Update all guardian records with this email to keep credentials synchronized and verified
                Guardian::where('email', $data['email'])->update([
                    'password' => $hashedPassword,
                    'is_verified' => true,
                    'status' => 'active',
                    'last_login_at' => now(),
                ]);
            }

            $guardian->refresh();
            $token = $guardian->createToken('guardian', ['guardian'])->plainTextToken;

            return response()->json([
                'message' => 'Guardian account activated successfully.',
                'token' => $token,
                'guardian' => $this->guardianPayload($guardian),
            ]);
        }

        // Option B: Guardian does not know patient registration number (Unlinked registration)
        // Check if an unlinked guardian portal account already exists for this email
        $unlinkedGuardian = Guardian::where('email', $data['email'])->whereNull('patient_id')->first();

        if ($unlinkedGuardian) {
            $unlinkedGuardian->update([
                'password' => $hashedPassword,
                'status' => 'active',
                'is_verified' => false,
                'name' => !empty($data['name']) ? $data['name'] : $unlinkedGuardian->name,
                'phone' => !empty($data['phone']) ? $data['phone'] : $unlinkedGuardian->phone,
                'last_login_at' => now(),
            ]);
            $guardian = $unlinkedGuardian;
        } else {
            // Check if there is an existing intake candidate record with this email
            $intakeCandidate = Guardian::where('email', $data['email'])->first();

            // Create an unlinked portal account (patient_id: null, is_verified: false).
            // This maintains the internal facility candidate record untouched in the database,
            // while ensuring that NO patient relationship or details are exposed to the portal user
            // until the receptionist manually confirms and links them via the Support Center.
            $guardian = Guardian::create([
                'patient_id' => null,
                'name' => !empty($data['name']) ? $data['name'] : ($intakeCandidate ? $intakeCandidate->name : explode('@', $data['email'])[0]),
                'relationship' => 'Pending Association',
                'phone' => !empty($data['phone']) ? $data['phone'] : ($intakeCandidate ? $intakeCandidate->phone : ''),
                'email' => $data['email'],
                'password' => $hashedPassword,
                'is_verified' => false,
                'status' => 'active',
                'last_login_at' => now(),
            ]);
        }

        $token = $guardian->createToken('guardian', ['guardian'])->plainTextToken;

        return response()->json([
            'message' => 'Your account has been created. Our reception team will help connect your account to the correct patient.',
            'token' => $token,
            'guardian' => $this->guardianPayload($guardian),
        ]);
    }

    /**
     * Guardian logout. Revokes current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        if ($bearer = $request->bearerToken()) {
            \Laravel\Sanctum\PersonalAccessToken::findToken($bearer)?->delete();
        }

        $token = $request->user()?->currentAccessToken();
        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Get authenticated guardian profile with accessible patients.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var Guardian $guardian */
        $guardian = $request->user();

        return response()->json([
            'guardian' => $this->guardianPayload($guardian),
        ]);
    }

    private function guardianPayload(Guardian $guardian): array
    {
        $isLinked = $guardian->isLinked();
        $patients = $isLinked ? $guardian->accessiblePatients() : collect([]);

        return [
            'id' => $guardian->id,
            'name' => $guardian->name,
            'email' => $guardian->email,
            'phone' => $guardian->phone,
            'relationship' => $isLinked ? $guardian->relationship : 'Support User',
            'status' => $guardian->status,
            'is_linked' => $isLinked,
            'last_login_at' => $guardian->last_login_at,
            'patients' => $patients->map(fn (Patient $p) => [
                'id' => $p->id,
                'patient_number' => $p->patient_number,
                'name' => $p->name,
                'status' => $p->status,
                'relationship' => Guardian::where('patient_id', $p->id)
                    ->where(function ($q) use ($guardian) {
                        $q->where('email', $guardian->email)
                          ->orWhere('id', $guardian->id);
                    })->value('relationship') ?? $guardian->relationship,
            ])->values(),
        ];
    }
}
