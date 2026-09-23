<?php

namespace Tests\Feature;

use App\Models\Admission;
use App\Models\Guardian;
use App\Models\GuardianMessage;
use App\Models\MedicationAdministration;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Role;
use App\Models\TreatmentSession;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class Phase11DoseLevelEMARAndGuardianLinkingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $doctor;
    protected User $receptionist;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Admin']);
        $receptionistRole = Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Receptionist']);
        $doctorRole = Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Doctor']);

        $this->admin = User::factory()->create(['status' => 'active']);
        $this->admin->roles()->attach($adminRole);

        $this->doctor = User::factory()->create(['status' => 'active']);
        $this->doctor->roles()->attach($doctorRole);

        $this->receptionist = User::factory()->create(['status' => 'active']);
        $this->receptionist->roles()->attach($receptionistRole);

        $this->patient = Patient::create([
            'patient_number' => 'RC-2026-99001',
            'name' => 'Test Patient Phase 11',
            'date_of_birth' => '1990-01-01',
            'gender' => 'male',
            'address' => 'Nibo, Awka South',
            'status' => 'active',
        ]);

        // Assign doctor to patient
        $this->patient->doctorAssignments()->create([
            'doctor_id' => $this->doctor->id,
            'assigned_by' => $this->admin->id,
            'assigned_at' => now(),
            'status' => 'active',
        ]);
    }

    /**
     * Test 1: Prescription creation generates individual dose-level MedicationAdministration records.
     */
    public function test_prescription_generates_dose_level_administrations_for_frequencies(): void
    {
        $payload = [
            'prescribed_at' => now()->toDateString(),
            'notes' => 'Multidose regimen testing',
            'items' => [
                [
                    'medication_name' => 'Amoxicillin',
                    'dosage' => '500mg',
                    'frequency' => 'TID', // Morning, Afternoon, Night
                    'duration' => '7 days',
                ],
                [
                    'medication_name' => 'Paracetamol',
                    'dosage' => '1000mg',
                    'frequency' => 'BID', // Morning, Night
                    'duration' => '5 days',
                ],
                [
                    'medication_name' => 'Multivitamin',
                    'dosage' => '1 tab',
                    'frequency' => 'Once daily', // Morning
                    'duration' => '14 days',
                ],
            ],
        ];

        $res = $this->actingAs($this->doctor, 'sanctum')
            ->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", $payload);

        $res->assertStatus(201);

        // Amoxicillin (TID) should have 3 doses per day
        $tidItem = PrescriptionItem::where('medication_name', 'Amoxicillin')->first();
        $this->assertNotNull($tidItem);
        $tidTodayDoses = MedicationAdministration::where('prescription_item_id', $tidItem->id)
            ->whereDate('scheduled_at', now()->toDateString())
            ->get();
        $this->assertCount(3, $tidTodayDoses);
        $this->assertEquals(['afternoon', 'morning', 'night'], $tidTodayDoses->pluck('dose_slot')->sort()->values()->toArray());

        // Paracetamol (BID) should have 2 doses per day
        $bidItem = PrescriptionItem::where('medication_name', 'Paracetamol')->first();
        $this->assertNotNull($bidItem);
        $bidTodayDoses = MedicationAdministration::where('prescription_item_id', $bidItem->id)
            ->whereDate('scheduled_at', now()->toDateString())
            ->get();
        $this->assertCount(2, $bidTodayDoses);
        $this->assertEquals(['morning', 'night'], $bidTodayDoses->pluck('dose_slot')->sort()->values()->toArray());

        // Multivitamin (Once daily) should have 1 dose per day (morning)
        $dailyItem = PrescriptionItem::where('medication_name', 'Multivitamin')->first();
        $this->assertNotNull($dailyItem);
        $dailyTodayDoses = MedicationAdministration::where('prescription_item_id', $dailyItem->id)
            ->whereDate('scheduled_at', now()->toDateString())
            ->get();
        $this->assertCount(1, $dailyTodayDoses);
        $this->assertEquals('morning', $dailyTodayDoses->first()->dose_slot);
    }

    /**
     * Test 2: Medication workspace endpoint returns structured active prescriptions, today schedule, and history.
     */
    public function test_medication_workspace_returns_grouped_schedule_and_day_status(): void
    {
        // Create a prescription with BID item
        $prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctor->id,
            'prescribed_at' => now(),
            'status' => 'active',
        ]);

        $item = $prescription->items()->create([
            'medication_name' => 'Sertraline',
            'dosage' => '50mg',
            'frequency' => 'BID',
            'duration' => '30 days',
        ]);

        $morningDose = MedicationAdministration::create([
            'patient_id' => $this->patient->id,
            'prescription_item_id' => $item->id,
            'scheduled_at' => now()->setTime(8, 0),
            'dose_slot' => 'morning',
            'status' => 'given',
            'administered_at' => now()->setTime(8, 5),
            'administered_by' => $this->admin->id,
        ]);

        $nightDose = MedicationAdministration::create([
            'patient_id' => $this->patient->id,
            'prescription_item_id' => $item->id,
            'scheduled_at' => now()->setTime(20, 0),
            'dose_slot' => 'night',
            'status' => 'scheduled',
        ]);

        $res = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?filter=today");

        $res->assertStatus(200)
            ->assertJsonStructure([
                'patient' => ['id', 'name', 'patient_number'],
                'active_prescriptions',
                'today_schedule',
                'history' => [
                    'current_page',
                    'data',
                    'last_page',
                    'total',
                ],
                'discontinued_prescriptions',
            ]);

        // Verify history contains the dose records
        $this->assertIsArray($res->json('history.data'));
        $this->assertGreaterThanOrEqual(2, count($res->json('history.data')));

        // Verify Admin can also access medication workspace with paginated history contract
        $adminRes = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?filter=all&page=1");
        $adminRes->assertStatus(200)
            ->assertJsonStructure([
                'patient' => ['id', 'name', 'patient_number'],
                'history' => ['current_page', 'data', 'last_page', 'total'],
            ]);
        $this->assertIsArray($adminRes->json('history.data'));

        // Verify Assigned Doctor can access medication workspace with paginated history contract
        $doctorRes = $this->actingAs($this->doctor, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?filter=today&page=1");
        $doctorRes->assertStatus(200)
            ->assertJsonStructure([
                'patient' => ['id', 'name', 'patient_number'],
                'history' => ['current_page', 'data', 'last_page', 'total'],
            ]);
        $this->assertIsArray($doctorRes->json('history.data'));

        // Verify Unassigned Doctor receives 403 Forbidden
        $otherDoctor = User::factory()->create(['status' => 'active']);
        $doctorRole = Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Doctor']);
        $otherDoctor->roles()->attach($doctorRole);
        $unassignedRes = $this->actingAs($otherDoctor, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace");
        $unassignedRes->assertStatus(403);

        $todaySchedule = $res->json('today_schedule');
        $this->assertCount(1, $todaySchedule);
        $this->assertEquals('in_progress', $todaySchedule[0]['day_status']);
        $this->assertEquals('given', $todaySchedule[0]['slots']['morning']['status']);
        $this->assertEquals('scheduled', $todaySchedule[0]['slots']['night']['status']);

        // Mark night dose as given -> day_status should become 'completed'
        $nightDose->update(['status' => 'given', 'administered_at' => now()]);
        $resCompleted = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?filter=today");
        $this->assertEquals('completed', $resCompleted->json('today_schedule.0.day_status'));

        // Mark night dose as refused -> day_status should become 'incomplete'
        $nightDose->update(['status' => 'refused']);
        $resIncomplete = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?filter=today");
        $this->assertEquals('incomplete', $resIncomplete->json('today_schedule.0.day_status'));
    }

    /**
     * Test 3: Discontinuing a prescription cancels future scheduled doses and records reaction reason.
     */
    public function test_discontinue_prescription_cancels_future_scheduled_doses(): void
    {
        $prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctor->id,
            'prescribed_at' => now(),
            'status' => 'active',
        ]);

        $item = $prescription->items()->create([
            'medication_name' => 'Carbamazepine',
            'dosage' => '200mg',
            'frequency' => 'Once daily',
            'duration' => '14 days',
        ]);

        // Yesterday's given dose
        MedicationAdministration::create([
            'patient_id' => $this->patient->id,
            'prescription_item_id' => $item->id,
            'scheduled_at' => now()->subDay()->setTime(8, 0),
            'dose_slot' => 'morning',
            'status' => 'given',
            'administered_at' => now()->subDay(),
            'administered_by' => $this->admin->id,
        ]);

        // Future scheduled doses
        $futureDose1 = MedicationAdministration::create([
            'patient_id' => $this->patient->id,
            'prescription_item_id' => $item->id,
            'scheduled_at' => now()->addDay()->setTime(8, 0),
            'dose_slot' => 'morning',
            'status' => 'scheduled',
        ]);

        $res = $this->actingAs($this->doctor, 'sanctum')
            ->patchJson("/api/v1/patients/{$this->patient->id}/prescriptions/{$prescription->id}/discontinue", [
                'discontinue_reason' => 'Cutaneous rash and pruritus',
                'notes' => 'Patient presented with allergic reaction on day 2.',
            ]);

        $res->assertStatus(200);

        $this->assertEquals('discontinued', $prescription->fresh()->status);
        $this->assertEquals('cancelled', $futureDose1->fresh()->status);
        $this->assertStringContainsString('Cutaneous rash', $futureDose1->fresh()->notes);
    }

    /**
     * Test 4: Guardian account activation without patient registration number (unlinked mode).
     */
    public function test_guardian_can_activate_without_patient_number(): void
    {
        $payload = [
            'email' => 'prospective.guardian@example.com',
            'name' => 'Emeka Obi',
            'phone' => '+234 803 111 2222',
            'password' => 'SecurePass123!',
            'password_confirmation' => 'SecurePass123!',
        ];

        $res = $this->postJson('/api/v1/guardian/activate', $payload);

        $res->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'guardian' => ['id', 'email', 'name', 'phone', 'is_linked'],
            ]);

        $guardian = Guardian::where('email', 'prospective.guardian@example.com')->first();
        $this->assertNotNull($guardian);
        $this->assertNull($guardian->patient_id);
        $this->assertFalse($guardian->isLinked());

        // Verify unlinked guardian me endpoint
        $authRes = $this->withToken($res->json('token'))->getJson('/api/v1/guardian/me');
        $authRes->assertStatus(200)
            ->assertJson([
                'guardian' => [
                    'email' => 'prospective.guardian@example.com',
                    'is_linked' => false,
                    'patients' => [],
                ],
            ]);

        // Existing patient guardian candidate scenario:
        // Patient intake recorded a guardian with an email, but no portal account yet (password is null)
        $intakeGuardian = Guardian::create([
            'patient_id' => $this->patient->id,
            'name' => 'Amaka Okafor',
            'relationship' => 'Mother',
            'phone' => '+234 803 777 6666',
            'email' => 'amaka.okafor@example.com',
            'password' => null,
            'is_verified' => false,
            'is_primary' => true,
        ]);

        // When activating WITHOUT patient registration number, portal relationship remains UNVERIFIED
        $intakeActivationRes = $this->postJson('/api/v1/guardian/activate', [
            'email' => 'amaka.okafor@example.com',
            'password' => 'PortalPass123!',
            'password_confirmation' => 'PortalPass123!',
        ]);

        $intakeActivationRes->assertStatus(200);
        $this->assertFalse($intakeActivationRes->json('guardian.is_linked'));
        $this->assertEmpty($intakeActivationRes->json('guardian.patients'));

        // The me endpoint must NOT expose patient info
        $intakeMeRes = $this->withToken($intakeActivationRes->json('token'))->getJson('/api/v1/guardian/me');
        $intakeMeRes->assertStatus(200);
        $this->assertFalse($intakeMeRes->json('guardian.is_linked'));
        $this->assertEmpty($intakeMeRes->json('guardian.patients'));
    }

    /**
     * Test 5: Unlinked guardian can send messages and receptionist sees unlinked pending status.
     */
    public function test_unlinked_guardian_can_send_support_messages(): void
    {
        $guardian = Guardian::create([
            'patient_id' => null,
            'name' => 'Ngozi Eze',
            'email' => 'ngozi.eze@example.com',
            'phone' => '+234 803 999 8888',
            'relationship' => 'Sister',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $token = $guardian->createToken('guardian-auth')->plainTextToken;

        // Unlinked guardian sends message
        $sendRes = $this->withToken($token)->postJson('/api/v1/guardian/messages', [
            'message' => 'Hello, I would like to inquire about residential admission for my brother.',
        ]);

        $sendRes->assertStatus(201);
        $this->assertNull($sendRes->json('data.patient_id'));

        // Guardian views conversation
        $viewRes = $this->withToken($token)->getJson('/api/v1/guardian/messages');
        $viewRes->assertStatus(200);
        $this->assertCount(1, $viewRes->json('messages'));
        $this->assertFalse($viewRes->json('is_linked'));

        // Receptionist views staff inbox
        $staffInboxRes = $this->actingAs($this->receptionist, 'sanctum')->getJson('/api/v1/messages');
        $staffInboxRes->assertStatus(200);

        $conversations = $staffInboxRes->json('conversations');
        $this->assertNotEmpty($conversations);
        $unlinkedConv = collect($conversations)->firstWhere('guardian_id', $guardian->id);
        $this->assertNotNull($unlinkedConv);
        $this->assertEquals('Patient not yet linked', $unlinkedConv['patient_name']);
        $this->assertEquals('Support User', $unlinkedConv['relationship']);
        $this->assertFalse($unlinkedConv['is_linked']);

        // Receptionist replies to unlinked guardian -> patient_id must remain null
        $replyRes = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson("/api/v1/staff/guardians/{$guardian->id}/reply", [
                'message' => 'Thank you for reaching out. A member of our admissions team will assist you.',
            ]);
        $replyRes->assertStatus(201);
        $this->assertNull($replyRes->json('data.patient_id'));
    }

    /**
     * Test 6: Calming delayed support notice appears after 90 seconds without staff reply.
     */
    public function test_delayed_support_notice_appears_after_90_seconds_without_staff_reply(): void
    {
        $guardian = Guardian::create([
            'patient_id' => $this->patient->id,
            'name' => 'Chidi Okeke',
            'email' => 'chidi.okeke@example.com',
            'phone' => '+234 803 555 4444',
            'relationship' => 'Brother',
            'password' => Hash::make('password123'),
            'is_active' => true,
        ]);

        $token = $guardian->createToken('guardian-auth')->plainTextToken;

        // Message sent 120 seconds ago
        $oldMsg = GuardianMessage::create([
            'patient_id' => $this->patient->id,
            'guardian_id' => $guardian->id,
            'sender_user_id' => null, // incoming from guardian
            'message' => 'Is visiting permitted tomorrow morning?',
        ]);
        DB::table('guardian_messages')->where('id', $oldMsg->id)->update([
            'created_at' => now()->subSeconds(120),
        ]);

        $resWithNotice = $this->withToken($token)->getJson("/api/v1/guardian/messages?patient_id={$this->patient->id}");
        $resWithNotice->assertStatus(200);
        $this->assertNotNull($resWithNotice->json('delayed_support_notice'));
        $this->assertEquals('Support Update', $resWithNotice->json('delayed_support_notice.title'));

        // Once receptionist replies, the notice disappears
        GuardianMessage::create([
            'patient_id' => $this->patient->id,
            'guardian_id' => $guardian->id,
            'sender_user_id' => $this->receptionist->id,
            'message' => 'Hello Chidi, yes visiting hours are 10:00 AM to 4:00 PM.',
            'created_at' => now(),
        ]);

        $resAfterStaffReply = $this->withToken($token)->getJson("/api/v1/guardian/messages?patient_id={$this->patient->id}");
        $resAfterStaffReply->assertStatus(200);
        $this->assertNull($resAfterStaffReply->json('delayed_support_notice'));
    }

    /**
     * Test 7: Receptionist can link unlinked guardian to patient and unlink without message deletion.
     */
    public function test_receptionist_can_link_and_unlink_guardian_patient(): void
    {
        $guardian = Guardian::create([
            'patient_id' => null,
            'name' => 'Ifeanyi Umeh',
            'email' => 'ifeanyi.umeh@example.com',
            'phone' => '+234 803 444 3333',
            'relationship' => 'Brother',
            'is_active' => true,
        ]);

        // Unlinked initial inquiry message
        $initialMsg = GuardianMessage::create([
            'patient_id' => null,
            'guardian_id' => $guardian->id,
            'sender_user_id' => null,
            'message' => 'Inquiry for admission of John Doe.',
        ]);

        // 1. Link guardian to patient
        $linkRes = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson("/api/v1/staff/guardians/{$guardian->id}/link-patient", [
                'patient_id' => $this->patient->id,
                'relationship' => 'Brother',
            ]);

        $linkRes->assertStatus(200)
            ->assertJson([
                'guardian' => ['is_linked' => true],
                'patient' => ['id' => $this->patient->id],
            ]);

        $this->assertEquals($this->patient->id, $guardian->fresh()->patient_id);
        $this->assertEquals($this->patient->id, $initialMsg->fresh()->patient_id);

        // Duplicate link attempt is rejected with 422
        $dupRes = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson("/api/v1/staff/guardians/{$guardian->id}/link-patient", [
                'patient_id' => $this->patient->id,
                'relationship' => 'Brother',
            ]);
        $dupRes->assertStatus(422);

        // 2. Unlink guardian from patient
        $unlinkRes = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson("/api/v1/staff/guardians/{$guardian->id}/unlink-patient");

        $unlinkRes->assertStatus(200)
            ->assertJson([
                'guardian' => ['is_linked' => false],
            ]);

        $this->assertNull($guardian->fresh()->patient_id);

        // Message history remains intact
        $this->assertDatabaseHas('guardian_messages', [
            'id' => $initialMsg->id,
            'guardian_id' => $guardian->id,
        ]);
    }
}
