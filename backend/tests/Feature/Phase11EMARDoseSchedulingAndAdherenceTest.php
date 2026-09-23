<?php

namespace Tests\Feature;

use App\Models\MedicationAdministration;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Role;
use App\Models\User;
use App\Services\MedicationScheduleService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Phase11EMARDoseSchedulingAndAdherenceTest extends TestCase
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
            'patient_number' => 'RC-2026-EMAR01',
            'name' => 'Adherence Test Patient',
            'date_of_birth' => '1988-04-12',
            'gender' => 'female',
            'address' => 'Enugu Road, Awka',
            'status' => 'active',
        ]);

        $this->patient->doctorAssignments()->create([
            'doctor_id' => $this->doctor->id,
            'assigned_by' => $this->admin->id,
            'assigned_at' => now(),
            'status' => 'active',
        ]);
    }

    /**
     * Test 1: Once daily -> 1 dose/day (Morning 08:00).
     */
    public function test_once_daily_frequency_generates_one_morning_dose_at_0800(): void
    {
        $response = $this->actingAs($this->doctor, 'sanctum')->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", [
            'prescribed_at' => now()->toDateString(),
            'notes' => 'Once daily test',
            'items' => [
                [
                    'medication_name' => 'Folic Acid',
                    'dosage' => '5mg',
                    'frequency' => 'Once daily',
                    'duration' => '3 days',
                ],
            ],
        ]);

        $response->assertStatus(201);

        $item = PrescriptionItem::where('medication_name', 'Folic Acid')->firstOrFail();
        $admins = MedicationAdministration::where('prescription_item_id', $item->id)->orderBy('scheduled_at')->get();

        $this->assertCount(3, $admins);
        foreach ($admins as $admin) {
            $this->assertEquals('morning', $admin->dose_slot);
            $this->assertEquals('08:00:00', Carbon::parse($admin->scheduled_at)->format('H:i:s'));
        }
    }

    /**
     * Test 2: Twice daily (2xdaily, 2, BID) -> 2 doses/day (Morning 08:00, Night 20:00).
     */
    public function test_twice_daily_and_numeric_frequency_generates_morning_and_night_doses(): void
    {
        $response = $this->actingAs($this->doctor, 'sanctum')->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", [
            'prescribed_at' => now()->toDateString(),
            'notes' => 'Twice daily test with numeric frequency',
            'items' => [
                [
                    'medication_name' => 'Paracetamol',
                    'dosage' => '1000mg',
                    'frequency' => '2xdaily',
                    'duration' => '2 days',
                ],
                [
                    'medication_name' => 'Clonidine',
                    'dosage' => '0.1mg',
                    'frequency' => '2', // Numeric frequency shorthand
                    'duration' => '2 days',
                ],
            ],
        ]);

        $response->assertStatus(201);

        // Check Paracetamol
        $paraItem = PrescriptionItem::where('medication_name', 'Paracetamol')->firstOrFail();
        $paraAdmins = MedicationAdministration::where('prescription_item_id', $paraItem->id)->orderBy('scheduled_at')->get();
        $this->assertCount(4, $paraAdmins); // 2 days * 2 doses
        $this->assertEquals(['morning', 'night', 'morning', 'night'], $paraAdmins->pluck('dose_slot')->all());

        // Check Clonidine (numeric "2")
        $clonItem = PrescriptionItem::where('medication_name', 'Clonidine')->firstOrFail();
        $clonAdmins = MedicationAdministration::where('prescription_item_id', $clonItem->id)->orderBy('scheduled_at')->get();
        $this->assertCount(4, $clonAdmins);
        $this->assertEquals(['morning', 'night', 'morning', 'night'], $clonAdmins->pluck('dose_slot')->all());
    }

    /**
     * Test 3: Three times daily (3xdaily, TID, 3) -> 3 doses/day (Morning 08:00, Afternoon 14:00, Night 20:00).
     */
    public function test_three_times_daily_frequency_generates_three_doses_per_day(): void
    {
        $response = $this->actingAs($this->doctor, 'sanctum')->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", [
            'prescribed_at' => now()->toDateString(),
            'notes' => 'Three times daily test',
            'items' => [
                [
                    'medication_name' => 'Amoxicillin',
                    'dosage' => '500mg',
                    'frequency' => '3xdaily',
                    'duration' => '2 days',
                ],
            ],
        ]);

        $response->assertStatus(201);

        $item = PrescriptionItem::where('medication_name', 'Amoxicillin')->firstOrFail();
        $admins = MedicationAdministration::where('prescription_item_id', $item->id)->orderBy('scheduled_at')->get();
        $this->assertCount(6, $admins); // 2 days * 3 doses

        $day1Slots = $admins->slice(0, 3)->pluck('dose_slot')->all();
        $this->assertEquals(['morning', 'afternoon', 'night'], $day1Slots);
    }

    /**
     * Test 4: Four times daily (4xdaily, QID, 4) -> 4 doses/day (Morning, Afternoon, Evening, Night).
     */
    public function test_four_times_daily_frequency_generates_four_doses_per_day(): void
    {
        $response = $this->actingAs($this->doctor, 'sanctum')->postJson("/api/v1/patients/{$this->patient->id}/prescriptions", [
            'prescribed_at' => now()->toDateString(),
            'notes' => 'Four times daily test',
            'items' => [
                [
                    'medication_name' => 'Ibuprofen Intensive',
                    'dosage' => '400mg',
                    'frequency' => '4xdaily',
                    'duration' => '1 day',
                ],
            ],
        ]);

        $response->assertStatus(201);

        $item = PrescriptionItem::where('medication_name', 'Ibuprofen Intensive')->firstOrFail();
        $admins = MedicationAdministration::where('prescription_item_id', $item->id)->orderBy('scheduled_at')->get();
        $this->assertCount(4, $admins);
        $this->assertEquals(['morning', 'afternoon', 'evening', 'night'], $admins->pluck('dose_slot')->all());
    }

    /**
     * Test 5: Partial administration (Morning Given, Night Pending) -> day_status and overall_day_status remain 'in_progress'.
     */
    public function test_partial_administration_remains_in_progress_and_not_completed(): void
    {
        $today = now()->toDateString();

        $prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctor->id,
            'status' => 'active',
            'prescribed_at' => $today,
        ]);

        $item = $prescription->items()->create([
            'medication_name' => 'Paracetamol',
            'dosage' => '1000mg',
            'frequency' => '2xdaily',
            'duration' => '3 days',
        ]);

        MedicationScheduleService::generateDoseAdministrations($item, $this->patient->id, $today);

        // Retrieve today's morning dose and mark it as given
        $morningDose = MedicationAdministration::where('prescription_item_id', $item->id)
            ->where('dose_slot', 'morning')
            ->whereDate('scheduled_at', $today)
            ->firstOrFail();

        $this->actingAs($this->receptionist, 'sanctum')->patchJson("/api/v1/medication-administrations/{$morningDose->id}", [
            'status' => 'given',
            'notes' => 'Morning dose taken with water',
        ])->assertStatus(200);

        // Fetch patient medication workspace
        $workspaceRes = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?date={$today}");

        $workspaceRes->assertStatus(200);
        $todaySchedule = $workspaceRes->json('today_schedule');

        $this->assertNotEmpty($todaySchedule);
        $paraSchedule = collect($todaySchedule)->firstWhere('prescription_item.medication_name', 'Paracetamol');

        // MUST be in_progress, NOT completed
        $this->assertEquals('in_progress', $paraSchedule['day_status']);
        $this->assertEquals('in_progress', $workspaceRes->json('overall_day_status'));
    }

    /**
     * Test 6: Full administration (Morning Given, Night Given) -> day_status becomes 'completed'.
     */
    public function test_full_administration_becomes_completed(): void
    {
        $today = now()->toDateString();

        $prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctor->id,
            'status' => 'active',
            'prescribed_at' => $today,
        ]);

        $item = $prescription->items()->create([
            'medication_name' => 'Metformin',
            'dosage' => '500mg',
            'frequency' => '2xdaily',
            'duration' => '3 days',
        ]);

        MedicationScheduleService::generateDoseAdministrations($item, $this->patient->id, $today);

        // Mark both morning and night as given
        $doses = MedicationAdministration::where('prescription_item_id', $item->id)
            ->whereDate('scheduled_at', $today)
            ->get();

        $this->assertCount(2, $doses);

        foreach ($doses as $dose) {
            $this->actingAs($this->receptionist, 'sanctum')->patchJson("/api/v1/medication-administrations/{$dose->id}", [
                'status' => 'given',
            ])->assertStatus(200);
        }

        $workspaceRes = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?date={$today}");

        $workspaceRes->assertStatus(200);
        $schedule = collect($workspaceRes->json('today_schedule'))->firstWhere('prescription_item.medication_name', 'Metformin');

        $this->assertEquals('completed', $schedule['day_status']);
        $this->assertEquals('completed', $workspaceRes->json('overall_day_status'));
    }

    /**
     * Test 7: Refused dose -> day_status and overall_day_status become 'incomplete'.
     */
    public function test_refused_dose_makes_regimen_incomplete(): void
    {
        $today = now()->toDateString();

        $prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctor->id,
            'status' => 'active',
            'prescribed_at' => $today,
        ]);

        $item = $prescription->items()->create([
            'medication_name' => 'Amlodipine',
            'dosage' => '5mg',
            'frequency' => 'Once daily',
            'duration' => '2 days',
        ]);

        MedicationScheduleService::generateDoseAdministrations($item, $this->patient->id, $today);

        $dose = MedicationAdministration::where('prescription_item_id', $item->id)
            ->whereDate('scheduled_at', $today)
            ->firstOrFail();

        $this->actingAs($this->receptionist, 'sanctum')->patchJson("/api/v1/medication-administrations/{$dose->id}", [
            'status' => 'refused',
            'notes' => 'Patient complained of nausea and refused dose',
        ])->assertStatus(200);

        $workspaceRes = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?date={$today}");

        $workspaceRes->assertStatus(200);
        $schedule = collect($workspaceRes->json('today_schedule'))->firstWhere('prescription_item.medication_name', 'Amlodipine');

        $this->assertEquals('incomplete', $schedule['day_status']);
        $this->assertEquals('incomplete', $workspaceRes->json('overall_day_status'));
    }

    /**
     * Test 8: Missed dose -> day_status and overall_day_status become 'incomplete'.
     */
    public function test_missed_dose_makes_regimen_incomplete(): void
    {
        $today = now()->toDateString();

        $prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctor->id,
            'status' => 'active',
            'prescribed_at' => $today,
        ]);

        $item = $prescription->items()->create([
            'medication_name' => 'Omeprazole',
            'dosage' => '20mg',
            'frequency' => '2xdaily',
            'duration' => '2 days',
        ]);

        MedicationScheduleService::generateDoseAdministrations($item, $this->patient->id, $today);

        $morningDose = MedicationAdministration::where('prescription_item_id', $item->id)
            ->where('dose_slot', 'morning')
            ->whereDate('scheduled_at', $today)
            ->firstOrFail();

        // Morning was given
        $this->actingAs($this->receptionist, 'sanctum')->patchJson("/api/v1/medication-administrations/{$morningDose->id}", [
            'status' => 'given',
        ])->assertStatus(200);

        $nightDose = MedicationAdministration::where('prescription_item_id', $item->id)
            ->where('dose_slot', 'night')
            ->whereDate('scheduled_at', $today)
            ->firstOrFail();

        // Night was missed
        $this->actingAs($this->receptionist, 'sanctum')->patchJson("/api/v1/medication-administrations/{$nightDose->id}", [
            'status' => 'missed',
            'notes' => 'Patient asleep during window',
        ])->assertStatus(200);

        $workspaceRes = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?date={$today}");

        $workspaceRes->assertStatus(200);
        $schedule = collect($workspaceRes->json('today_schedule'))->firstWhere('prescription_item.medication_name', 'Omeprazole');

        $this->assertEquals('incomplete', $schedule['day_status']);
        $this->assertEquals('incomplete', $workspaceRes->json('overall_day_status'));
    }

    /**
     * Test 9: Future doses stay 'scheduled' (pending) and not marked missed or incomplete.
     */
    public function test_future_doses_stay_pending_and_not_marked_missed_or_incomplete(): void
    {
        $tomorrow = now()->addDay()->toDateString();

        $prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctor->id,
            'status' => 'active',
            'prescribed_at' => now()->toDateString(),
        ]);

        $item = $prescription->items()->create([
            'medication_name' => 'Lisinopril',
            'dosage' => '10mg',
            'frequency' => 'Once daily',
            'duration' => '5 days',
        ]);

        MedicationScheduleService::generateDoseAdministrations($item, $this->patient->id, now()->toDateString());

        // Check tomorrow's dose
        $tomorrowDose = MedicationAdministration::where('prescription_item_id', $item->id)
            ->whereDate('scheduled_at', $tomorrow)
            ->firstOrFail();

        $this->assertEquals('scheduled', $tomorrowDose->status);

        $workspaceRes = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?date={$tomorrow}");

        $workspaceRes->assertStatus(200);
        $schedule = collect($workspaceRes->json('today_schedule'))->firstWhere('prescription_item.medication_name', 'Lisinopril');

        $this->assertEquals('in_progress', $schedule['day_status']);
        $this->assertEquals('in_progress', $workspaceRes->json('overall_day_status'));
    }

    /**
     * Test 10: Multiple medications calculate independent regimen statuses and combined overall patient status.
     */
    public function test_multiple_medications_calculate_independent_and_overall_adherence(): void
    {
        $today = now()->toDateString();

        $prescription = Prescription::create([
            'patient_id' => $this->patient->id,
            'practitioner_id' => $this->doctor->id,
            'status' => 'active',
            'prescribed_at' => $today,
        ]);

        // Med A: Once daily
        $medA = $prescription->items()->create([
            'medication_name' => 'Multivitamin Daily',
            'dosage' => '1 cap',
            'frequency' => 'Once daily',
            'duration' => '7 days',
        ]);

        // Med B: Twice daily
        $medB = $prescription->items()->create([
            'medication_name' => 'Paracetamol 500',
            'dosage' => '500mg',
            'frequency' => '2xdaily',
            'duration' => '7 days',
        ]);

        MedicationScheduleService::generateDoseAdministrations($medA, $this->patient->id, $today);
        MedicationScheduleService::generateDoseAdministrations($medB, $this->patient->id, $today);

        // Med A morning dose given
        $medADose = MedicationAdministration::where('prescription_item_id', $medA->id)
            ->whereDate('scheduled_at', $today)
            ->firstOrFail();
        $this->actingAs($this->receptionist, 'sanctum')->patchJson("/api/v1/medication-administrations/{$medADose->id}", [
            'status' => 'given',
        ])->assertStatus(200);

        // Med B morning dose given, night dose still pending
        $medBMorning = MedicationAdministration::where('prescription_item_id', $medB->id)
            ->where('dose_slot', 'morning')
            ->whereDate('scheduled_at', $today)
            ->firstOrFail();
        $this->actingAs($this->receptionist, 'sanctum')->patchJson("/api/v1/medication-administrations/{$medBMorning->id}", [
            'status' => 'given',
        ])->assertStatus(200);

        // Workspace Check 1: Med A is completed, Med B is in_progress, Overall is in_progress
        $res1 = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?date={$today}");

        $schedule1 = collect($res1->json('today_schedule'));
        $this->assertEquals('completed', $schedule1->firstWhere('prescription_item.medication_name', 'Multivitamin Daily')['day_status']);
        $this->assertEquals('in_progress', $schedule1->firstWhere('prescription_item.medication_name', 'Paracetamol 500')['day_status']);
        $this->assertEquals('in_progress', $res1->json('overall_day_status'));

        // Med B night dose is now marked given
        $medBNight = MedicationAdministration::where('prescription_item_id', $medB->id)
            ->where('dose_slot', 'night')
            ->whereDate('scheduled_at', $today)
            ->firstOrFail();
        $this->actingAs($this->receptionist, 'sanctum')->patchJson("/api/v1/medication-administrations/{$medBNight->id}", [
            'status' => 'given',
        ])->assertStatus(200);

        // Workspace Check 2: Both completed, Overall is completed
        $res2 = $this->actingAs($this->receptionist, 'sanctum')
            ->getJson("/api/v1/patients/{$this->patient->id}/medication-workspace?date={$today}");

        $schedule2 = collect($res2->json('today_schedule'));
        $this->assertEquals('completed', $schedule2->firstWhere('prescription_item.medication_name', 'Multivitamin Daily')['day_status']);
        $this->assertEquals('completed', $schedule2->firstWhere('prescription_item.medication_name', 'Paracetamol 500')['day_status']);
        $this->assertEquals('completed', $res2->json('overall_day_status'));
    }
}
