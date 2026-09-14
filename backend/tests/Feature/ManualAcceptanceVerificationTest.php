<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\User;
use App\Models\MedicationAdministration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class ManualAcceptanceVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $authorizedDoctor;
    protected Patient $patient;
    protected Prescription $prescription;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Admin']);
        $receptionistRole = Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Receptionist']);
        $doctorRole = Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Doctor']);

        $this->adminUser = User::factory()->create([
            'email' => 'admin@niborehab.test',
            'status' => 'active',
        ]);
        $this->adminUser->roles()->attach($adminRole);

        $this->receptionistUser = User::factory()->create([
            'email' => 'receptionist@niborehab.test',
            'status' => 'active',
        ]);
        $this->receptionistUser->roles()->attach($receptionistRole);

        $this->authorizedDoctor = User::factory()->create([
            'email' => 'doctor@niborehab.test',
            'status' => 'active',
        ]);
        $this->authorizedDoctor->roles()->attach($doctorRole);

        $this->patient = Patient::create([
            'patient_number' => 'RC-2026-ACCEPT01',
            'name' => 'Acceptance Patient',
            'date_of_birth' => '1995-05-15',
            'gender' => 'male',
            'address' => '100 Rehab Way',
            'status' => 'active',
        ]);

        Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'assigned_staff_id' => $this->authorizedDoctor->id,
            'status' => 'approved',
            'visitor_name' => 'Acceptance Patient',
            'visitor_phone' => '08012345678',
            'reason' => 'Intake Evaluation',
            'preferred_at' => now(),
        ]);

        $this->prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->authorizedDoctor->id,
            'status' => 'active',
            'notes' => 'Daily antibiotic regimen',
            'prescribed_at' => now(),
        ]);

        $item = $this->prescription->items()->create([
            'medication_name' => 'Amoxicillin',
            'dosage' => '500mg',
            'frequency' => 'Three times daily',
            'duration' => '7 days',
            'instructions' => 'Take after meals',
        ]);

        MedicationAdministration::create([
            'patient_id' => $this->patient->id,
            'prescription_item_id' => $item->id,
            'scheduled_at' => now()->addHours(1),
            'status' => 'scheduled',
            'notes' => 'Scheduled morning dose',
        ]);
    }

    /**
     * Verify Bug 1: Admin receives paginated response with data array for prescriptions.
     */
    public function test_admin_receives_paginated_prescriptions_and_administrations(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@niborehab.test',
            'password' => 'password',
        ]);
        $token = $loginRes->json('token');

        // 1. Fetch Prescriptions
        $prescRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/patients/{$this->patient->id}/prescriptions");

        $prescRes->assertStatus(200);
        $json = $prescRes->json();

        // Must be paginated structure: Object with current_page, data, per_page, total
        $this->assertIsArray($json);
        $this->assertArrayHasKey('current_page', $json);
        $this->assertArrayHasKey('data', $json);
        $this->assertIsArray($json['data']);
        $this->assertCount(1, $json['data']);
        $this->assertEquals('Amoxicillin', $json['data'][0]['items'][0]['medication_name']);

        // 2. Fetch Medication Administrations
        $adminRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-administrations");

        $adminRes->assertStatus(200);
        $adminJson = $adminRes->json();

        // Must also be paginated structure
        $this->assertArrayHasKey('current_page', $adminJson);
        $this->assertArrayHasKey('data', $adminJson);
        $this->assertIsArray($adminJson['data']);
        $this->assertCount(1, $adminJson['data']);
        $this->assertEquals('scheduled', $adminJson['data'][0]['status']);
    }

    /**
     * Verify Bug 1: Receptionist is strictly forbidden from prescriptions (403),
     * but permitted to view medication administration schedules (200).
     */
    public function test_receptionist_prescription_restriction_and_emar_access(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'receptionist@niborehab.test',
            'password' => 'password',
        ]);
        $token = $loginRes->json('token');

        // 1. Prescriptions must return 403 Forbidden
        $prescRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/patients/{$this->patient->id}/prescriptions");

        $prescRes->assertStatus(403)
            ->assertJsonPath('message', 'You are not authorized to access this resource.');

        // 2. Medication Administrations must return 200 OK (staff operational eMAR access)
        $adminRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-administrations");

        $adminRes->assertStatus(200);
        $adminJson = $adminRes->json();
        $this->assertArrayHasKey('data', $adminJson);
        $this->assertCount(1, $adminJson['data']);
    }

    /**
     * Verify Bug 2: Logout invalidates token and prevents further access.
     */
    public function test_logout_invalidates_token_and_blocks_dashboard_access(): void
    {
        $loginRes = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@niborehab.test',
            'password' => 'password',
        ]);
        $token = $loginRes->json('token');

        // Flush session cookies to simulate pure API / frontend client Bearer token header
        $this->flushSession();

        // Verify authenticated access works
        $meRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');
        $meRes->assertStatus(200);

        // Perform logout
        $logoutRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/auth/logout');
        $logoutRes->assertStatus(200)
            ->assertJsonPath('message', 'Logged out.');

        // Verify token no longer exists in database
        $tokenId = explode('|', $token)[0];
        $this->assertNull(PersonalAccessToken::find($tokenId));

        // Clear test cookies and memory auth state to verify pure bearer token rejection
        $this->defaultCookies = [];
        Auth::forgetGuards();
        $blockedRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/v1/auth/me');
        $blockedRes->assertStatus(401);
    }
}
