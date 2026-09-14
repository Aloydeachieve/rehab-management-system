<?php

namespace Tests\Feature;

use App\Models\Admission;
use App\Models\Appointment;
use App\Models\Guardian;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Role;
use App\Models\TreatmentPricingConfig;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class Phase10SecurityAuditTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $doctorUser;
    protected Guardian $guardianUser;
    protected Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        Notification::fake();

        $adminRole = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Admin']);
        $receptionistRole = Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Receptionist']);
        $doctorRole = Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Doctor']);

        $this->adminUser = User::factory()->create(['status' => 'active']);
        $this->adminUser->roles()->attach($adminRole);

        $this->receptionistUser = User::factory()->create(['status' => 'active']);
        $this->receptionistUser->roles()->attach($receptionistRole);

        $this->doctorUser = User::factory()->create(['status' => 'active']);
        $this->doctorUser->roles()->attach($doctorRole);

        $this->patient = Patient::create([
            'patient_number' => 'RC-2026-SEC01',
            'name' => 'Security Audit Patient',
            'date_of_birth' => '1995-05-15',
            'gender' => 'male',
            'phone' => '08011223344',
            'address' => '12 Security Way, Abuja',
            'status' => 'active',
        ]);

        $this->guardianUser = Guardian::create([
            'patient_id' => $this->patient->id,
            'name' => 'Security Guardian',
            'phone' => '08099887766',
            'email' => 'secguardian@example.com',
            'relationship' => 'parent',
            'access_code' => 'AUDIT999',
            'status' => 'active',
        ]);
    }

    public function test_doctor_cannot_access_guardians_of_unassigned_patient(): void
    {
        Sanctum::actingAs($this->doctorUser);

        // Doctor has no appointment or assignment for this patient
        $response = $this->getJson("/api/v1/patients/{$this->patient->id}/guardians");

        $response->assertStatus(403);
    }

    public function test_doctor_can_access_guardians_of_assigned_patient(): void
    {
        // Assign doctor via appointment factory
        Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'assigned_staff_id' => $this->doctorUser->id,
            'status' => 'scheduled',
        ]);

        Sanctum::actingAs($this->doctorUser);

        $response = $this->getJson("/api/v1/patients/{$this->patient->id}/guardians");

        $response->assertStatus(200);
        $response->assertJsonStructure(['guardians']);
    }

    public function test_doctor_cannot_access_admissions_of_unassigned_patient(): void
    {
        Admission::create([
            'patient_id' => $this->patient->id,
            'admission_number' => 'ADM-SEC-01',
            'admission_date' => Carbon::now()->toDateString(),
            'admission_type' => 'voluntary',
            'admitted_by' => $this->receptionistUser->id,
            'room_number' => '101',
            'bed_number' => 'A',
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->doctorUser);

        $response = $this->getJson("/api/v1/patients/{$this->patient->id}/admissions");

        $response->assertStatus(403);
    }

    public function test_doctor_can_access_admissions_of_assigned_patient(): void
    {
        Admission::create([
            'patient_id' => $this->patient->id,
            'admission_number' => 'ADM-SEC-02',
            'admission_date' => Carbon::now()->toDateString(),
            'admission_type' => 'voluntary',
            'admitted_by' => $this->receptionistUser->id,
            'room_number' => '102',
            'bed_number' => 'B',
            'status' => 'active',
        ]);

        Appointment::factory()->create([
            'patient_id' => $this->patient->id,
            'assigned_staff_id' => $this->doctorUser->id,
            'status' => 'scheduled',
        ]);

        Sanctum::actingAs($this->doctorUser);

        $response = $this->getJson("/api/v1/patients/{$this->patient->id}/admissions");

        $response->assertStatus(200);
        $response->assertJsonStructure(['admissions']);
    }

    public function test_guardian_token_is_rejected_on_staff_auth_me_endpoint(): void
    {
        Sanctum::actingAs($this->guardianUser, ['guardian']);

        $response = $this->getJson('/api/v1/auth/me');

        $response->assertStatus(403);
    }

    public function test_guardian_token_is_rejected_on_staff_patients_endpoint(): void
    {
        Sanctum::actingAs($this->guardianUser, ['guardian']);

        $response = $this->getJson('/api/v1/patients');

        $response->assertStatus(403);
    }

    public function test_guardian_token_is_rejected_on_staff_invoices_endpoint(): void
    {
        Sanctum::actingAs($this->guardianUser, ['guardian']);

        $response = $this->getJson('/api/v1/invoices');

        $response->assertStatus(403);
    }

    public function test_staff_token_is_rejected_on_guardian_endpoints(): void
    {
        Sanctum::actingAs($this->adminUser);

        $meResponse = $this->getJson('/api/v1/guardian/me');
        $meResponse->assertStatus(403);

        $messagesResponse = $this->getJson('/api/v1/guardian/messages');
        $messagesResponse->assertStatus(403);
    }

    public function test_receptionist_cannot_access_confidential_clinical_records(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        // Clinical notes
        $r1 = $this->getJson("/api/v1/patients/{$this->patient->id}/clinical-notes");
        $r1->assertStatus(403);

        // Medical history
        $r2 = $this->getJson("/api/v1/patients/{$this->patient->id}/medical-history");
        $r2->assertStatus(403);

        // Assessments
        $r3 = $this->getJson("/api/v1/patients/{$this->patient->id}/assessments");
        $r3->assertStatus(403);

        // Prescriptions
        $r4 = $this->getJson("/api/v1/patients/{$this->patient->id}/prescriptions");
        $r4->assertStatus(403);
    }

    public function test_receptionist_cannot_access_medication_reports(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $response = $this->getJson('/api/v1/reports/medications');
        $response->assertStatus(403);
    }

    public function test_pricing_config_updates_restricted_to_admin(): void
    {
        // Receptionist cannot update pricing config
        Sanctum::actingAs($this->receptionistUser);
        $resRec = $this->putJson('/api/v1/pricing-config', [
            'initial_session_price' => 350000,
            'subsequent_session_price' => 250000,
            'currency' => 'NGN',
            'session_duration_days' => 30,
        ]);
        $resRec->assertStatus(403);

        // Doctor cannot update pricing config
        Sanctum::actingAs($this->doctorUser);
        $resDoc = $this->putJson('/api/v1/pricing-config', [
            'initial_session_price' => 350000,
            'subsequent_session_price' => 250000,
            'currency' => 'NGN',
            'session_duration_days' => 30,
        ]);
        $resDoc->assertStatus(403);

        // Admin can update pricing config
        Sanctum::actingAs($this->adminUser);
        $resAdmin = $this->putJson('/api/v1/pricing-config', [
            'initial_session_price' => 350000,
            'subsequent_session_price' => 250000,
            'currency' => 'NGN',
            'session_duration_days' => 30,
        ]);
        $resAdmin->assertStatus(200);
        $resAdmin->assertJsonPath('config.initial_session_price', '350000.00');
    }

    public function test_billing_integrity_overpayment_and_duplicate_reference(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $invoice = Invoice::create([
            'invoice_number' => 'INV-SEC-999',
            'patient_id' => $this->patient->id,
            'amount' => 100000.00,
            'amount_paid' => 0.00,
            'balance' => 100000.00,
            'due_date' => Carbon::now()->addDays(14)->toDateString(),
            'status' => 'unpaid',
        ]);

        // 1. Overpayment rejected
        $overpayResponse = $this->postJson('/api/v1/payments', [
            'invoice_id' => $invoice->id,
            'amount' => 150000.00,
            'method' => 'bank_transfer',
            'reference' => 'PAY-SEC-01',
            'paid_at' => Carbon::now()->toDateString(),
        ]);
        $overpayResponse->assertStatus(422);

        // 2. Valid partial payment
        $validPayResponse = $this->postJson('/api/v1/payments', [
            'invoice_id' => $invoice->id,
            'amount' => 40000.00,
            'method' => 'bank_transfer',
            'reference' => 'PAY-SEC-UNIQUE',
            'paid_at' => Carbon::now()->toDateString(),
        ]);
        $validPayResponse->assertStatus(201);

        // 3. Duplicate payment reference rejected
        $dupPayResponse = $this->postJson('/api/v1/payments', [
            'invoice_id' => $invoice->id,
            'amount' => 10000.00,
            'method' => 'bank_transfer',
            'reference' => 'PAY-SEC-UNIQUE',
            'paid_at' => Carbon::now()->toDateString(),
        ]);
        $dupPayResponse->assertStatus(422);
    }
}
