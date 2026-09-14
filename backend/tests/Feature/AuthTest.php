<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $doctorUser;
    protected User $receptionistUser;
    protected User $inactiveUser;
    protected Guardian $guardianUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Admin']);
        $doctorRole = Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Doctor']);
        $receptionistRole = Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Receptionist']);

        $this->adminUser = User::factory()->create([
            'email' => 'admin@rehabcenter.local',
            'password' => Hash::make('AdminPass123!'),
            'status' => 'active',
        ]);
        $this->adminUser->roles()->attach($adminRole);

        $this->doctorUser = User::factory()->create([
            'email' => 'doctor@rehabcenter.local',
            'password' => Hash::make('DoctorPass123!'),
            'status' => 'active',
        ]);
        $this->doctorUser->roles()->attach($doctorRole);

        $this->receptionistUser = User::factory()->create([
            'email' => 'receptionist@rehabcenter.local',
            'password' => Hash::make('RecepPass123!'),
            'status' => 'active',
        ]);
        $this->receptionistUser->roles()->attach($receptionistRole);

        $this->inactiveUser = User::factory()->create([
            'email' => 'inactive@rehabcenter.local',
            'password' => Hash::make('InactivePass123!'),
            'status' => 'inactive',
        ]);
        $this->inactiveUser->roles()->attach($receptionistRole);

        $patient = Patient::create([
            'patient_number' => 'RC-2026-AUTHTEST',
            'name' => 'Auth Test Patient',
            'date_of_birth' => '1992-02-02',
            'gender' => 'male',
            'status' => 'active',
        ]);

        $this->guardianUser = Guardian::create([
            'patient_id' => $patient->id,
            'name' => 'Auth Test Guardian',
            'email' => 'guardian@rehabcenter.local',
            'relationship' => 'parent',
            'phone' => '08011223344',
            'password' => Hash::make('GuardianPass123!'),
            'access_code' => 'GUARDAUTH1',
            'status' => 'active',
        ]);
    }

    public function test_admin_can_login_and_receive_token(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@rehabcenter.local',
            'password' => 'AdminPass123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'roles']]);

        $this->assertContains('admin', $response->json('user.roles'));
    }

    public function test_doctor_can_login_and_receive_token(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'doctor@rehabcenter.local',
            'password' => 'DoctorPass123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'roles']]);

        $this->assertContains('doctor', $response->json('user.roles'));
    }

    public function test_receptionist_can_login_and_receive_token(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'receptionist@rehabcenter.local',
            'password' => 'RecepPass123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'roles']]);

        $this->assertContains('receptionist', $response->json('user.roles'));
    }

    public function test_inactive_staff_cannot_login(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'inactive@rehabcenter.local',
            'password' => 'InactivePass123!',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('message', 'This account is not active.');
    }

    public function test_invalid_password_returns_validation_error(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@rehabcenter.local',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_authenticated_staff_can_access_auth_me(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@rehabcenter.local',
            'password' => 'AdminPass123!',
        ]);

        $token = $loginRes->json('token');

        $meRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $meRes->assertStatus(200)
            ->assertJsonPath('user.email', 'admin@rehabcenter.local');
    }

    public function test_staff_logout_revokes_bearer_token(): void
    {
        $plainToken = $this->adminUser->createToken('staff')->plainTextToken;

        $logoutRes = $this->withHeader('Authorization', "Bearer {$plainToken}")
            ->postJson('/api/v1/auth/logout');

        $logoutRes->assertStatus(200);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_id' => $this->adminUser->id,
            'tokenable_type' => User::class,
        ]);
    }

    public function test_staff_token_cannot_access_guardian_endpoints(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@rehabcenter.local',
            'password' => 'AdminPass123!',
        ]);

        $token = $loginRes->json('token');

        $guardianRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/guardian/me');

        $guardianRes->assertStatus(403);
    }

    public function test_guardian_token_cannot_access_staff_auth_me(): void
    {
        $guardianLogin = $this->postJson('/api/v1/guardian/login', [
            'email' => 'guardian@rehabcenter.local',
            'password' => 'GuardianPass123!',
        ]);

        $guardianLogin->assertStatus(200);
        $token = $guardianLogin->json('token');

        $staffMeRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');

        $staffMeRes->assertStatus(403);
    }
}
