<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the staff users (Admin only).
     */
    public function index(): JsonResponse
    {
        $users = User::with(['roles', 'staffProfile'])->latest()->get();

        $formatted = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'roles' => $user->roles->pluck('name'),
                'staff_profile' => $user->staffProfile ? [
                    'profession' => $user->staffProfile->profession,
                    'license_number' => $user->staffProfile->license_number,
                    'status' => $user->staffProfile->status,
                ] : null,
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at' => $user->created_at?->toIso8601String(),
            ];
        });

        return response()->json(['users' => $formatted]);
    }

    /**
     * Store a newly created staff user in storage (Admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'phone' => ['nullable', 'string', 'max:25'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in([Role::ADMIN, Role::DOCTOR, Role::RECEPTIONIST])],
            'profession' => ['nullable', 'string', 'max:255'],
            'license_number' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'password' => Hash::make($data['password']),
            'status' => 'active',
        ]);

        $roleObj = Role::where('name', $data['role'])->first();
        if ($roleObj) {
            $user->roles()->sync([$roleObj->id]);
        }

        if (in_array($data['role'], [Role::DOCTOR, Role::RECEPTIONIST])) {
            $user->staffProfile()->create([
                'profession' => $data['profession'] ?? ucfirst($data['role']),
                'license_number' => $data['license_number'] ?? null,
                'status' => 'active',
            ]);
        }

        return response()->json([
            'message' => 'Staff account created successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'roles' => $user->roles->pluck('name'),
            ]
        ], 201);
    }

    /**
     * Update the specified staff user (Admin only).
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:25'],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'string', Rule::in([Role::ADMIN, Role::DOCTOR, Role::RECEPTIONIST])],
            'status' => ['required', 'string', Rule::in(['active', 'inactive'])],
            'profession' => ['nullable', 'string', 'max:255'],
            'license_number' => ['nullable', 'string', 'max:255'],
        ]);

        $userUpdate = [
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'status' => $data['status'],
        ];

        if (!empty($data['password'])) {
            $userUpdate['password'] = Hash::make($data['password']);
        }

        $user->update($userUpdate);

        $roleObj = Role::where('name', $data['role'])->first();
        if ($roleObj) {
            $user->roles()->sync([$roleObj->id]);
        }

        if (in_array($data['role'], [Role::DOCTOR, Role::RECEPTIONIST])) {
            $user->staffProfile()->updateOrCreate(
                ['user_id' => $user->id],
                [
                    'profession' => $data['profession'] ?? ucfirst($data['role']),
                    'license_number' => $data['license_number'] ?? null,
                    'status' => $data['status'],
                ]
            );
        } else {
            // Delete staff profile if changed to Admin
            $user->staffProfile()?->delete();
        }

        return response()->json([
            'message' => 'Staff account updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'status' => $user->status,
                'roles' => $user->roles->pluck('name'),
            ]
        ]);
    }

    /**
     * Toggle status of the staff user (Deactivate/Activate) (Admin only).
     */
    public function destroy(User $user): JsonResponse
    {
        // Don't allow self-deactivation
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 400);
        }

        $newStatus = $user->status === 'active' ? 'inactive' : 'active';
        $user->update(['status' => $newStatus]);
        $user->staffProfile()?->update(['status' => $newStatus]);

        return response()->json([
            'message' => "Staff account is now {$newStatus}.",
            'status' => $newStatus
        ]);
    }
}
