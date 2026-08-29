<?php

namespace Tests\Feature;

use App\Models\Admission;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PatientAdmissionTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $doctorUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        $adminRole = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Admin']);
        $receptionistRole = Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Receptionist']);
        $doctorRole = Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Doctor']);

        // Create users
        $this->adminUser = User::factory()->create(['status' => 'active']);
        $this->adminUser->roles()->attach($adminRole);

        $this->receptionistUser = User::factory()->create(['status' => 'active']);
        $this->receptionistUser->roles()->attach($receptionistRole);

        $this->doctorUser = User::factory()->create(['status' => 'active']);
        $this->doctorUser->roles()->attach($doctorRole);
    }

    /**
     * Test receptionist can register a new patient with primary guardian details.
     */
    public function test_receptionist_can_register_patient_with_guardian(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $payload = [
            'name' => 'Chioma Nwachukwu',
            'date_of_birth' => '2000-05-15',
            'gender' => 'female',
            'address' => '12 Rehab Road, Nibo, Anambra State',
            'phone' => '+2348031112222',
            'guardian_name' => 'Obinna Nwachukwu',
            'guardian_relationship' => 'Father',
            'guardian_phone' => '+2348039998888',
            'guardian_email' => 'obinna@gmail.com',
            'guardian_address' => '12 Rehab Road, Nibo',
        ];

        $response = $this->postJson('/api/v1/patients', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Patient registered successfully.')
            ->assertJsonStructure([
                'patient' => [
                    'id',
                    'patient_number',
                    'name',
                    'date_of_birth',
                    'gender',
                    'address',
                    'status',
                    'guardians',
                ]
            ]);

        $patient = Patient::first();
        $this->assertNotNull($patient);
        $this->assertStringStartsWith('RC-' . now()->year . '-', $patient->patient_number);

        $this->assertDatabaseHas('patients', [
            'name' => 'Chioma Nwachukwu',
            'phone' => '+2348031112222',
        ]);

        $this->assertDatabaseHas('guardians', [
            'patient_id' => $patient->id,
            'name' => 'Obinna Nwachukwu',
            'is_primary' => true,
        ]);
    }

    /**
     * Test doctor cannot register a patient.
     */
    public function test_doctor_cannot_register_patient(): void
    {
        Sanctum::actingAs($this->doctorUser);

        $response = $this->postJson('/api/v1/patients', [
            'name' => 'Unauthorized Patient',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test receptionist can admit registered patient.
     */
    public function test_receptionist_can_admit_patient(): void
    {
        $patient = Patient::create([
            'patient_number' => 'RC-2026-00001',
            'name' => 'Patient One',
            'date_of_birth' => '1995-10-10',
            'gender' => 'male',
            'address' => 'Test Address',
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->receptionistUser);

        $payload = [
            'admission_date' => now()->format('Y-m-d'),
            'admission_type' => 'voluntary',
            'notes' => 'Client arrived voluntarily seeking rehabilitation.',
        ];

        $response = $this->postJson("/api/v1/patients/{$patient->id}/admission", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Patient admitted successfully.');

        $this->assertDatabaseHas('admissions', [
            'patient_id' => $patient->id,
            'admission_type' => 'voluntary',
            'admitted_by' => $this->receptionistUser->id,
            'status' => 'active',
        ]);
    }

    /**
     * Test doctor cannot record admission.
     */
    public function test_doctor_cannot_admit_patient(): void
    {
        $patient = Patient::create([
            'patient_number' => 'RC-2026-00001',
            'name' => 'Patient One',
            'date_of_birth' => '1995-10-10',
            'gender' => 'male',
            'address' => 'Test Address',
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->doctorUser);

        $response = $this->postJson("/api/v1/patients/{$patient->id}/admission", [
            'admission_date' => now()->format('Y-m-d'),
            'admission_type' => 'voluntary',
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test doctor can view patients listing and detail.
     */
    public function test_doctor_can_view_patients_listing_and_profile(): void
    {
        $patient = Patient::create([
            'patient_number' => 'RC-2026-00001',
            'name' => 'Patient One',
            'date_of_birth' => '1995-10-10',
            'gender' => 'male',
            'address' => 'Test Address',
            'status' => 'active',
        ]);

        \App\Models\Appointment::factory()->create([
            'patient_id' => $patient->id,
            'assigned_staff_id' => $this->doctorUser->id,
            'status' => 'approved',
            'visitor_name' => $patient->name,
            'visitor_phone' => '1234567890',
            'reason' => 'Assessment',
            'preferred_at' => now(),
        ]);

        Sanctum::actingAs($this->doctorUser);

        $listResponse = $this->getJson('/api/v1/patients');
        $listResponse->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $viewResponse = $this->getJson("/api/v1/patients/{$patient->id}");
        $viewResponse->assertStatus(200)
            ->assertJsonPath('patient.name', 'Patient One');
    }
}
