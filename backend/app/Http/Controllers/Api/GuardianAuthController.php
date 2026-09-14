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

        $guardian = Guardian::where('email', $request->email)->first();

        if (! $guardian || ! $guardian->password || ! Hash::check($request->password, $guardian->password)) {
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
            'patient_number' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

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
            throw ValidationException::withMessages([
                'email' => ['No guardian record matching this email is registered for the specified patient.'],
            ]);
        }

        $hashedPassword = Hash::make($data['password']);

        // Update all guardian records with this email to keep credentials synchronized
        Guardian::where('email', $data['email'])->update([
            'password' => $hashedPassword,
            'status' => 'active',
            'last_login_at' => now(),
        ]);

        $guardian->refresh();
        $token = $guardian->createToken('guardian', ['guardian'])->plainTextToken;

        return response()->json([
            'message' => 'Guardian account activated successfully.',
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
        $patients = $guardian->accessiblePatients();

        return [
            'id' => $guardian->id,
            'name' => $guardian->name,
            'email' => $guardian->email,
            'phone' => $guardian->phone,
            'relationship' => $guardian->relationship,
            'status' => $guardian->status,
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
