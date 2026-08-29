<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Role;
use App\Models\MedicationAdministration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MedicationAdministrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $authorizedDoctor;
    protected User $unauthorizedDoctor;
    protected Patient $patient;
    protected Patient $otherPatient;
    protected Prescription $prescription;
    protected PrescriptionItem $prescriptionItem;

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

        // Create patients
        $this->patient = Patient::create([
            'patient_number' => 'RC-2026-00001',
            'name' => 'Client One',
            'date_of_birth' => '1995-10-10',
            'gender' => 'male',
            'address' => 'Test Address',
            'status' => 'active',
        ]);

        $this->otherPatient = Patient::create([
            'patient_number' => 'RC-2026-00002',
            'name' => 'Client Two',
            'date_of_birth' => '1990-05-05',
            'gender' => 'female',
            'address' => 'Another Addr',
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

        // Create prescription with item
        $this->prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->authorizedDoctor->id,
            'status' => 'active',
            'notes' => 'Prescribing testing med.',
            'prescribed_at' => now(),
        ]);

        $this->prescriptionItem = $this->prescription->items()->create([
            'medication_name' => 'Aspirin',
            'dosage' => '100mg',
            'frequency' => 'Once daily',
            'duration' => '7 days',
            'instructions' => 'Take with water',
        ]);
    }

    /**
     * Test receptionist can view medication schedules.
     */
    public function test_authorized_staff_can_view_medication_schedules(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        // Create a scheduled dose
        $adminRecord = MedicationAdministration::create([
            'patient_id' => $this->patient->id,
            'prescription_item_id' => $this->prescriptionItem->id,
            'scheduled_at' => now()->addHours(2),
            'status' => 'scheduled',
        ]);

        $response = $this->getJson("/api/v1/patients/{$this->patient->id}/medication-administrations");
        $response->assertStatus(200)
            ->assertJsonPath('data.0.id', $adminRecord->id);
    }

    /**
     * Test staff can mark medication as given.
     */
    public function test_staff_can_record_medication_as_given(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $adminRecord = MedicationAdministration::create([
            'patient_id' => $this->patient->id,
            'prescription_item_id' => $this->prescriptionItem->id,
            'scheduled_at' => now(),
            'status' => 'scheduled',
        ]);

        $response = $this->patchJson("/api/v1/medication-administrations/{$adminRecord->id}", [
            'status' => 'given',
            'notes' => 'Administered successfully.',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('medication_administrations', [
            'id' => $adminRecord->id,
            'status' => 'given',
            'administered_by' => $this->receptionistUser->id,
            'notes' => 'Administered successfully.',
        ]);

        $updatedRecord = MedicationAdministration::find($adminRecord->id);
        $this->assertNotNull($updatedRecord->administered_at);
    }

    /**
     * Test staff can record medication as missed, refused, or cancelled.
     */
    public function test_staff_can_record_missed_refused_cancelled_medication(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $statuses = ['missed', 'refused', 'cancelled'];

        foreach ($statuses as $status) {
            $adminRecord = MedicationAdministration::create([
                'patient_id' => $this->patient->id,
                'prescription_item_id' => $this->prescriptionItem->id,
                'scheduled_at' => now(),
                'status' => 'scheduled',
            ]);

            $response = $this->patchJson("/api/v1/medication-administrations/{$adminRecord->id}", [
                'status' => $status,
                'notes' => "Patient reason for {$status}",
            ]);

            $response->assertStatus(200);

            $this->assertDatabaseHas('medication_administrations', [
                'id' => $adminRecord->id,
                'status' => $status,
                'administered_by' => $this->receptionistUser->id,
                'notes' => "Patient reason for {$status}",
                'administered_at' => null, // Should remain null for missed/refused/cancelled
            ]);
        }
    }

    /**
     * Test cross-patient validation.
     */
    public function test_invalid_prescription_patient_combinations_are_rejected(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        // Try to create administration logging otherPatient with patient's prescription item
        $response = $this->postJson("/api/v1/medication-administrations", [
            'patient_id' => $this->otherPatient->id,
            'prescription_item_id' => $this->prescriptionItem->id,
            'scheduled_at' => now()->toDateString(),
            'status' => 'scheduled',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['prescription_item_id']);
    }

    /**
     * Test Doctor and Receptionist role separation on writing controls.
     */
    public function test_role_gating_prescribing_and_administering_controls(): void
    {
        // 1. Receptionist cannot prescribe medication
        Sanctum::actingAs($this->receptionistUser);
        $prescResponse = $this->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", [
            'notes' => 'Attempt by receptionist',
            'items' => [
                ['medication_name' => 'Aspirin', 'dosage' => '100mg', 'frequency' => 'Once daily', 'duration' => '7 days']
            ]
        ]);
        $prescResponse->assertStatus(403); // Clinicians group middleware blocks receptionist

        // 2. Doctor cannot write medication administration records
        Sanctum::actingAs($this->authorizedDoctor);
        $adminRecord = MedicationAdministration::create([
            'patient_id' => $this->patient->id,
            'prescription_item_id' => $this->prescriptionItem->id,
            'scheduled_at' => now(),
            'status' => 'scheduled',
        ]);

        $adminResponse = $this->patchJson("/api/v1/medication-administrations/{$adminRecord->id}", [
            'status' => 'given',
        ]);
        $adminResponse->assertStatus(403); // Doctors blocked from writing administrations
    }

    /**
     * Test Doctor patient authorization permissions.
     */
    public function test_doctor_medication_view_access_rules(): void
    {
        // 1. Authorized Doctor can view medication schedules
        Sanctum::actingAs($this->authorizedDoctor);
        $response = $this->getJson("/api/v1/patients/{$this->patient->id}/medication-administrations");
        $response->assertStatus(200);

        // 2. Unauthorized Doctor cannot view medication schedules (returns 403)
        Sanctum::actingAs($this->unauthorizedDoctor);
        $response2 = $this->getJson("/api/v1/patients/{$this->patient->id}/medication-administrations");
        $response2->assertStatus(403);
    }
}
