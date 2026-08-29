<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use App\Models\VitalSign;
use App\Models\TreatmentPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ClinicalRecordTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $authorizedDoctor;
    protected User $unauthorizedDoctor;
    protected Patient $patient;

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

        $this->authorizedDoctor = User::factory()->create(['status' => 'active']);
        $this->authorizedDoctor->roles()->attach($doctorRole);

        $this->unauthorizedDoctor = User::factory()->create(['status' => 'active']);
        $this->unauthorizedDoctor->roles()->attach($doctorRole);

        // Create patient
        $this->patient = Patient::create([
            'patient_number' => 'RC-2026-00001',
            'name' => 'John Doe',
            'date_of_birth' => '1990-01-01',
            'gender' => 'male',
            'address' => '123 Test St',
            'status' => 'active',
        ]);

        // Link authorized doctor via appointment assignment
        Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'assigned_staff_id' => $this->authorizedDoctor->id,
            'status' => 'approved',
            'visitor_name' => 'John Doe',
            'visitor_phone' => '1234567890',
            'reason' => 'Intake',
            'preferred_at' => now(),
        ]);
    }

    /**
     * Test admin has full clinical read and write access.
     */
    public function test_admin_can_read_and_create_clinical_records(): void
    {
        Sanctum::actingAs($this->adminUser);

        // 1. Create vital sign
        $vitalsResponse = $this->postJson("/api/v1/patients/{$this->patient->id}/vital-signs", [
            'temperature' => 37.2,
            'pulse' => 80,
            'blood_pressure' => '120/80',
            'respiratory_rate' => 16,
            'weight' => 75.5,
            'notes' => 'Normal vitals',
        ]);
        $vitalsResponse->assertStatus(201);
        $this->assertDatabaseHas('vital_signs', [
            'patient_id' => $this->patient->id,
            'recorded_by' => $this->adminUser->id,
            'temperature' => 37.2,
        ]);

        // 2. Read vitals
        $readResponse = $this->getJson("/api/v1/patients/{$this->patient->id}/vital-signs");
        $readResponse->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test authorized doctor has clinical read/write access.
     */
    public function test_authorized_doctor_can_read_and_create_clinical_records(): void
    {
        Sanctum::actingAs($this->authorizedDoctor);

        $notesResponse = $this->postJson("/api/v1/patients/{$this->patient->id}/clinical-notes", [
            'note_type' => 'daily',
            'content' => 'Client is demonstrating positive interaction indicators.',
        ]);
        $notesResponse->assertStatus(201);
        $this->assertDatabaseHas('clinical_notes', [
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->authorizedDoctor->id,
            'content' => 'Client is demonstrating positive interaction indicators.',
        ]);

        $readResponse = $this->getJson("/api/v1/patients/{$this->patient->id}/clinical-notes");
        $readResponse->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * Test unauthorized doctor (not assigned) is forbidden from accessing patient EMR.
     */
    public function test_unauthorized_doctor_cannot_access_patient_clinical_records(): void
    {
        Sanctum::actingAs($this->unauthorizedDoctor);

        // Try reading notes
        $readResponse = $this->getJson("/api/v1/patients/{$this->patient->id}/clinical-notes");
        $readResponse->assertStatus(403);

        // Try posting history
        $writeResponse = $this->postJson("/api/v1/patients/{$this->patient->id}/medical-history", [
            'content' => 'Prior history of substance abuse.',
        ]);
        $writeResponse->assertStatus(403);
    }

    /**
     * Test receptionist cannot read or write clinical records.
     */
    public function test_receptionist_is_denied_for_clinical_endpoints(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        // Read check
        $readResponse = $this->getJson("/api/v1/patients/{$this->patient->id}/vital-signs");
        $readResponse->assertStatus(403);

        // Write check
        $writeResponse = $this->postJson("/api/v1/patients/{$this->patient->id}/vital-signs", [
            'temperature' => 37.0,
        ]);
        $writeResponse->assertStatus(403);
    }

    /**
     * Test validation constraints.
     */
    public function test_validation_rejects_invalid_clinical_data(): void
    {
        Sanctum::actingAs($this->authorizedDoctor);

        // Vitals out of bounds
        $vitalsResponse = $this->postJson("/api/v1/patients/{$this->patient->id}/vital-signs", [
            'temperature' => 99.9, // Temp too high
            'pulse' => 400, // Pulse too high
        ]);
        $vitalsResponse->assertStatus(422)
            ->assertJsonValidationErrors(['temperature', 'pulse']);
    }

    /**
     * Test multi-item prescriptions can be registered.
     */
    public function test_prescription_can_contain_multiple_medication_items(): void
    {
        Sanctum::actingAs($this->authorizedDoctor);

        $payload = [
            'notes' => 'Prescription items for observations stage.',
            'items' => [
                [
                    'medication_name' => 'Clonidine',
                    'dosage' => '0.1 mg',
                    'frequency' => 'Twice daily',
                    'duration' => '7 days',
                    'instructions' => 'Take with water.',
                ],
                [
                    'medication_name' => 'Diazepam',
                    'dosage' => '5 mg',
                    'frequency' => 'Once daily at night',
                    'duration' => '5 days',
                    'instructions' => 'Monitor sedation level.',
                ]
            ]
        ];

        $response = $this->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", $payload);
        $response->assertStatus(201);

        $this->assertDatabaseHas('prescriptions', [
            'patient_id' => $this->patient->id,
            'notes' => 'Prescription items for observations stage.',
        ]);

        $this->assertDatabaseHas('prescription_items', [
            'medication_name' => 'Clonidine',
            'dosage' => '0.1 mg',
        ]);

        $this->assertDatabaseHas('prescription_items', [
            'medication_name' => 'Diazepam',
            'dosage' => '5 mg',
        ]);
    }

    /**
     * Test treatment plan deactivations and historical preservation.
     */
    public function test_treatment_plan_creation_and_history_preservation(): void
    {
        Sanctum::actingAs($this->authorizedDoctor);

        // 1. Create initial active plan
        $plan1 = $this->postJson("/api/v1/patients/{$this->patient->id}/treatment-plans", [
            'goals' => 'Initial stabilization goals.',
            'plan' => 'Observation phase treatment plan.',
            'review_date' => now()->addDays(7)->format('Y-m-d'),
        ]);
        $plan1->assertStatus(201);

        $this->assertDatabaseHas('treatment_plans', [
            'goals' => 'Initial stabilization goals.',
            'status' => 'active',
        ]);

        // 2. Create second treatment plan (should complete the first one)
        $plan2 = $this->postJson("/api/v1/patients/{$this->patient->id}/treatment-plans", [
            'goals' => 'Phase 2 progression plans.',
            'plan' => 'Therapy inclusion plans.',
            'review_date' => now()->addDays(14)->format('Y-m-d'),
        ]);
        $plan2->assertStatus(201);

        // Verify plan1 is completed, plan2 is active (historical preservation check)
        $this->assertDatabaseHas('treatment_plans', [
            'goals' => 'Initial stabilization goals.',
            'status' => 'completed',
        ]);

        $this->assertDatabaseHas('treatment_plans', [
            'goals' => 'Phase 2 progression plans.',
            'status' => 'active',
        ]);
    }
}
