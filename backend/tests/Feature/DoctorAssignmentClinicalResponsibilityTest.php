<?php

namespace Tests\Feature;

use App\Models\Admission;
use App\Models\Appointment;
use App\Models\ClinicalNote;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\PatientDoctorAssignment;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\TreatmentSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DoctorAssignmentClinicalResponsibilityTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $doctorUserA;
    protected User $doctorUserB;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        // Ensure roles
        $adminRole = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Admin']);
        $receptionistRole = Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Receptionist']);
        $doctorRole = Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Doctor']);

        // Create test users
        $this->adminUser = User::factory()->create(['name' => 'Admin User', 'status' => 'active']);
        $this->adminUser->roles()->attach($adminRole);

        $this->receptionistUser = User::factory()->create(['name' => 'Front Desk', 'status' => 'active']);
        $this->receptionistUser->roles()->attach($receptionistRole);

        $this->doctorUserA = User::factory()->create(['name' => 'Dr. Chidi Okafor', 'status' => 'active']);
        $this->doctorUserA->roles()->attach($doctorRole);

        $this->doctorUserB = User::factory()->create(['name' => 'Dr. Ngozi Eze', 'status' => 'active']);
        $this->doctorUserB->roles()->attach($doctorRole);

        // Create test patient with NO appointments
        $this->patient = Patient::create([
            'patient_number' => 'RC-2026-00099',
            'name' => 'Emeka Johnson',
            'date_of_birth' => '1995-05-15',
            'gender' => 'male',
            'address' => '45 Nibo Road, Awka',
            'status' => 'active',
        ]);
    }

    public function test_admin_can_assign_doctor_to_patient(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson("/api/v1/patients/{$this->patient->id}/doctor-assignments", [
            'doctor_id' => $this->doctorUserA->id,
            'notes' => 'Assigned as primary attending physician.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.doctor_id', $this->doctorUserA->id)
            ->assertJsonPath('data.status', 'active');

        $this->assertDatabaseHas('patient_doctor_assignments', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorUserA->id,
            'assigned_by' => $this->adminUser->id,
            'status' => 'active',
        ]);
    }

    public function test_admin_can_reassign_doctor_and_previous_assignment_is_preserved_as_inactive(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Initial assignment
        $this->postJson("/api/v1/patients/{$this->patient->id}/doctor-assignments", [
            'doctor_id' => $this->doctorUserA->id,
            'notes' => 'First doctor',
        ])->assertStatus(201);

        // Reassign to Doctor B
        $reassignResponse = $this->postJson("/api/v1/patients/{$this->patient->id}/doctor-assignments", [
            'doctor_id' => $this->doctorUserB->id,
            'notes' => 'Handover to Doctor B',
        ]);

        $reassignResponse->assertStatus(201)
            ->assertJsonPath('data.doctor_id', $this->doctorUserB->id)
            ->assertJsonPath('data.status', 'active');

        // Verify history preserved: 2 total records
        $this->assertDatabaseCount('patient_doctor_assignments', 2);

        // Doctor A's assignment is now inactive with unassigned_at timestamp
        $this->assertDatabaseHas('patient_doctor_assignments', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorUserA->id,
            'status' => 'inactive',
        ]);

        // Doctor B's assignment is now active
        $this->assertDatabaseHas('patient_doctor_assignments', [
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorUserB->id,
            'status' => 'active',
        ]);
    }

    public function test_receptionist_cannot_assign_doctor(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $response = $this->postJson("/api/v1/patients/{$this->patient->id}/doctor-assignments", [
            'doctor_id' => $this->doctorUserA->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_doctor_cannot_assign_themselves_or_others(): void
    {
        Sanctum::actingAs($this->doctorUserA);

        $response = $this->postJson("/api/v1/patients/{$this->patient->id}/doctor-assignments", [
            'doctor_id' => $this->doctorUserA->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_assigned_doctor_can_access_patient_records_without_appointment(): void
    {
        // Give Doctor A persistent assignment
        PatientDoctorAssignment::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorUserA->id,
            'assigned_by' => $this->adminUser->id,
            'assigned_at' => now(),
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->doctorUserA);

        // Doctor A can access profile
        $this->getJson("/api/v1/patients/{$this->patient->id}")
            ->assertStatus(200)
            ->assertJsonPath('patient.id', $this->patient->id);

        // Doctor A can access clinical notes
        $this->getJson("/api/v1/patients/{$this->patient->id}/clinical-notes")
            ->assertStatus(200);
    }

    public function test_unassigned_doctor_receives_403_accessing_clinical_records(): void
    {
        // Patient has no doctor assigned
        Sanctum::actingAs($this->doctorUserA);

        $this->getJson("/api/v1/patients/{$this->patient->id}/clinical-notes")
            ->assertStatus(403);
    }

    public function test_doctor_cannot_access_another_doctors_assigned_patient(): void
    {
        // Assign patient exclusively to Doctor A
        PatientDoctorAssignment::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorUserA->id,
            'assigned_by' => $this->adminUser->id,
            'assigned_at' => now(),
            'status' => 'active',
        ]);

        // Doctor B tries to access
        Sanctum::actingAs($this->doctorUserB);

        $this->getJson("/api/v1/patients/{$this->patient->id}/clinical-notes")
            ->assertStatus(403);

        $this->getJson("/api/v1/patients/{$this->patient->id}")
            ->assertStatus(403);
    }

    public function test_doctor_can_create_structured_clinical_observations(): void
    {
        PatientDoctorAssignment::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorUserA->id,
            'assigned_by' => $this->adminUser->id,
            'assigned_at' => now(),
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->doctorUserA);

        $response = $this->postJson("/api/v1/patients/{$this->patient->id}/clinical-notes", [
            'note_type' => 'Appetite',
            'content' => 'Patient showed improved appetite and finished full evening meal without agitation.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.note_type', 'Appetite');

        $this->assertDatabaseHas('clinical_notes', [
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctorUserA->id,
            'note_type' => 'Appetite',
        ]);
    }

    public function test_admin_created_notes_are_automatically_labeled_administrative_observation(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson("/api/v1/patients/{$this->patient->id}/clinical-notes", [
            'note_type' => 'General Note',
            'content' => 'Administrative review of patient identification documents completed.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.note_type', 'Administrative Observation');

        $this->assertDatabaseHas('clinical_notes', [
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->adminUser->id,
            'note_type' => 'Administrative Observation',
        ]);
    }

    public function test_only_doctors_can_prescribe_medication(): void
    {
        PatientDoctorAssignment::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorUserA->id,
            'assigned_by' => $this->adminUser->id,
            'assigned_at' => now(),
            'status' => 'active',
        ]);

        $prescriptionData = [
            'notes' => 'Anti-anxiety therapy',
            'items' => [
                [
                    'medication_name' => 'Diazepam',
                    'dosage' => '5mg',
                    'frequency' => 'Once daily',
                    'duration' => '7 days',
                    'instructions' => 'Take at bedtime',
                ],
            ],
        ];

        // Doctor A can prescribe
        Sanctum::actingAs($this->doctorUserA);
        $doctorRes = $this->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", $prescriptionData);
        $doctorRes->assertStatus(201);

        // Admin cannot prescribe (403)
        Sanctum::actingAs($this->adminUser);
        $adminRes = $this->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", $prescriptionData);
        $adminRes->assertStatus(403);

        // Receptionist cannot prescribe (403)
        Sanctum::actingAs($this->receptionistUser);
        $recRes = $this->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", $prescriptionData);
        $recRes->assertStatus(403);
    }

    public function test_doctor_can_discontinue_prescription_for_medication_reaction(): void
    {
        PatientDoctorAssignment::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorUserA->id,
            'assigned_by' => $this->adminUser->id,
            'assigned_at' => now(),
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->doctorUserA);

        // Create prescription
        $prescriptionRes = $this->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", [
            'notes' => 'Initial medication',
            'items' => [
                [
                    'medication_name' => 'Haloperidol',
                    'dosage' => '2mg',
                    'frequency' => 'BID',
                    'duration' => '5 days',
                ],
            ],
        ]);
        $prescriptionId = $prescriptionRes->json('data.id');

        // Discontinue prescription due to medication reaction
        $discontinueRes = $this->patchJson("/api/v1/patients/{$this->patient->id}/prescriptions/{$prescriptionId}/discontinue", [
            'reason' => 'Patient developed acute rash and skin sensitivity.',
            'clinical_action' => 'Immediately discontinued dose. Switching to alternative therapy.',
        ]);

        $discontinueRes->assertStatus(200)
            ->assertJsonPath('data.status', 'discontinued');

        // Verify auditable clinical record was created
        $this->assertDatabaseHas('clinical_notes', [
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctorUserA->id,
            'note_type' => 'Medication Reaction',
        ]);
    }

    public function test_doctor_dashboard_endpoint_returns_assigned_patients_and_metrics(): void
    {
        PatientDoctorAssignment::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctorUserA->id,
            'assigned_by' => $this->adminUser->id,
            'assigned_at' => now(),
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->doctorUserA);

        $response = $this->getJson('/api/v1/dashboard/doctor');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'doctor_name',
                'statistics' => [
                    'active_patients',
                    'patients_requiring_review',
                    'sessions_ending_soon',
                    'pending_reassessments',
                    'recent_observations',
                ],
                'patients',
                'generated_at',
            ])
            ->assertJsonPath('statistics.active_patients', 1);
    }

    public function test_dashboard_analytics_endpoint_returns_period_metrics(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/dashboard/analytics?period=this_month');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'period',
                'range' => ['start', 'end'],
                'patient_activity',
                'revenue_breakdown' => [
                    'total_invoiced',
                    'total_collected',
                    'outstanding_balance',
                    'overdue_balance',
                    'chart_data',
                ],
                'appointments',
                'medications',
                'generated_at',
            ]);
    }
}
