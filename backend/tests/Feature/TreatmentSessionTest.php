<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Role;
use App\Models\TreatmentSession;
use App\Models\User;
use App\Models\VitalSign;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TreatmentSessionTest extends TestCase
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
            'name' => 'Client One',
            'date_of_birth' => '1995-10-10',
            'gender' => 'male',
            'address' => 'Test Address',
            'status' => 'active',
        ]);

        // Link authorized doctor via appointment assignment
        Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'assigned_staff_id' => $this->authorizedDoctor->id,
            'status' => 'approved',
            'visitor_name' => $this->patient->name,
            'visitor_phone' => '1234567890',
            'reason' => 'Observation Intake',
            'preferred_at' => now(),
        ]);
    }

    /**
     * Test admitting a patient automatically spawns Session 1 for exactly 30 days.
     */
    public function test_admission_spawns_session_one_for_30_days(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $payload = [
            'admission_date' => '2026-08-29',
            'admission_type' => 'voluntary',
            'notes' => 'Arrived for care.',
        ];

        // Create another patient to admit
        $newPatient = Patient::create([
            'patient_number' => 'RC-2026-00002',
            'name' => 'New Patient',
            'date_of_birth' => '1992-05-05',
            'gender' => 'female',
            'address' => 'Addr',
            'status' => 'active',
        ]);

        $response = $this->postJson("/api/v1/patients/{$newPatient->id}/admission", $payload);
        $response->assertStatus(201);

        $this->assertDatabaseHas('treatment_sessions', [
            'patient_id' => $newPatient->id,
            'session_number' => 1,
            'start_date' => '2026-08-29',
            'expected_end_date' => '2026-09-28', // exactly 30 days
            'status' => 'active',
            'payment_status' => 'unpaid',
        ]);
    }

    /**
     * Test authorized doctor can create, list, and view sessions.
     */
    public function test_authorized_doctor_session_management_flow(): void
    {
        Sanctum::actingAs($this->authorizedDoctor);

        // Initiate a session manually
        $response = $this->postJson("/api/v1/patients/{$this->patient->id}/sessions", [
            'start_date' => '2026-08-29',
            'notes' => 'Session 1 starting manually',
        ]);
        $response->assertStatus(201);

        $session = TreatmentSession::first();
        $this->assertNotNull($session);
        $this->assertEquals(1, $session->session_number);

        // List sessions
        $listResponse = $this->getJson("/api/v1/patients/{$this->patient->id}/sessions");
        $listResponse->assertStatus(200)
            ->assertJsonCount(1);

        // Show session details
        $showResponse = $this->getJson("/api/v1/sessions/{$session->id}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('session_number', 1);
    }

    /**
     * Test receptionist and unauthorized doctor are denied write controls.
     */
    public function test_receptionist_and_unassigned_doctor_restricted_from_clinical_transitions(): void
    {
        // 1. Create a session
        $session = TreatmentSession::create([
            'patient_id' => $this->patient->id,
            'session_number' => 1,
            'start_date' => '2026-08-29',
            'expected_end_date' => '2026-09-28',
            'status' => 'active',
            'payment_status' => 'unpaid',
        ]);

        // Receptionist attempt
        Sanctum::actingAs($this->receptionistUser);
        $receptionistResponse = $this->postJson("/api/v1/sessions/{$session->id}/reassessment", [
            'recommendation' => 'continue',
            'notes' => 'Findings',
        ]);
        $receptionistResponse->assertStatus(403);

        // Unauthorized Doctor attempt
        Sanctum::actingAs($this->unauthorizedDoctor);
        $unauthorizedDocResponse = $this->postJson("/api/v1/sessions/{$session->id}/reassessment", [
            'recommendation' => 'continue',
            'notes' => 'Findings',
        ]);
        $unauthorizedDocResponse->assertStatus(403);
    }

    /**
     * Test reassessment and treatment continuation flow.
     */
    public function test_reassessment_and_treatment_continuation(): void
    {
        Sanctum::actingAs($this->authorizedDoctor);

        $session = TreatmentSession::create([
            'patient_id' => $this->patient->id,
            'session_number' => 1,
            'start_date' => '2026-08-29',
            'expected_end_date' => '2026-09-28',
            'status' => 'active',
            'payment_status' => 'unpaid',
        ]);

        // 1. Reassess
        $reassessRes = $this->postJson("/api/v1/sessions/{$session->id}/reassessment", [
            'recommendation' => 'continue',
            'notes' => 'Client is making progress but requires additional stabilization phase.',
        ]);
        $reassessRes->assertStatus(200);

        $this->assertDatabaseHas('treatment_sessions', [
            'id' => $session->id,
            'recommendation' => 'continue',
            'reassessed_by' => $this->authorizedDoctor->id,
        ]);

        // 2. Continue
        $continueRes = $this->postJson("/api/v1/sessions/{$session->id}/continue");
        $continueRes->assertStatus(201);

        // Session 1 is closed
        $this->assertDatabaseHas('treatment_sessions', [
            'id' => $session->id,
            'status' => 'completed',
            'actual_end_date' => now()->toDateString(),
            'decision_by' => $this->authorizedDoctor->id,
        ]);

        // Session 2 is active
        $this->assertDatabaseHas('treatment_sessions', [
            'patient_id' => $this->patient->id,
            'session_number' => 2,
            'status' => 'active',
            'start_date' => now()->toDateString(),
        ]);
    }

    /**
     * Test patient discharge flow.
     */
    public function test_reassessment_and_discharge(): void
    {
        Sanctum::actingAs($this->authorizedDoctor);

        $session = TreatmentSession::create([
            'patient_id' => $this->patient->id,
            'session_number' => 1,
            'start_date' => '2026-08-29',
            'expected_end_date' => '2026-09-28',
            'status' => 'active',
            'payment_status' => 'unpaid',
        ]);

        // 1. Reassess with discharge recommendation
        $reassessRes = $this->postJson("/api/v1/sessions/{$session->id}/reassessment", [
            'recommendation' => 'discharge',
            'notes' => 'Patient has completed stabilization objectives.',
        ]);
        $reassessRes->assertStatus(200);

        // 2. Discharge
        $dischargeRes = $this->postJson("/api/v1/sessions/{$session->id}/discharge");
        $dischargeRes->assertStatus(200);

        // Session 1 status is discharged
        $this->assertDatabaseHas('treatment_sessions', [
            'id' => $session->id,
            'status' => 'discharged',
            'actual_end_date' => now()->toDateString(),
        ]);

        // Patient status is updated to discharged
        $this->assertDatabaseHas('patients', [
            'id' => $this->patient->id,
            'status' => 'discharged',
        ]);
    }

    /**
     * Test invalid transitions are rejected.
     */
    public function test_invalid_transitions_are_rejected(): void
    {
        Sanctum::actingAs($this->authorizedDoctor);

        $session = TreatmentSession::create([
            'patient_id' => $this->patient->id,
            'session_number' => 1,
            'start_date' => '2026-08-29',
            'expected_end_date' => '2026-09-28',
            'status' => 'active',
            'payment_status' => 'unpaid',
        ]);

        // Try continuing before reassessment
        $response = $this->postJson("/api/v1/sessions/{$session->id}/continue");
        $response->assertStatus(422)
            ->assertJsonPath('message', 'A reassessment recommending continuation must be recorded first.');
    }

    /**
     * Test EMR records link correctly to sessions.
     */
    public function test_EMR_records_link_correctly_to_sessions(): void
    {
        Sanctum::actingAs($this->authorizedDoctor);

        $session = TreatmentSession::create([
            'patient_id' => $this->patient->id,
            'session_number' => 1,
            'start_date' => '2026-08-29',
            'expected_end_date' => '2026-09-28',
            'status' => 'active',
            'payment_status' => 'unpaid',
        ]);

        // Log clinical note linked to session
        \App\Models\ClinicalNote::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->authorizedDoctor->id,
            'treatment_session_id' => $session->id,
            'note_type' => 'clinical',
            'content' => 'Client is stable.',
            'recorded_at' => now(),
        ]);

        $showResponse = $this->getJson("/api/v1/sessions/{$session->id}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('clinical_notes.0.content', 'Client is stable.');
    }
}
