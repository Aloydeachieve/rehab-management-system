<?php

namespace Tests\Feature;

use App\Models\Admission;
use App\Models\Appointment;
use App\Models\Guardian;
use App\Models\GuardianMessage;
use App\Models\Invoice;
use App\Models\MedicationAdministration;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\TreatmentPricingConfig;
use App\Models\TreatmentSession;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminDashboardReportingTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $doctorUser;
    protected Guardian $guardianUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Admin']);
        $receptionistRole = Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Receptionist']);
        $doctorRole = Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Doctor']);

        $this->adminUser = User::factory()->create(['status' => 'active']);
        $this->adminUser->roles()->attach($adminRole);

        $this->receptionistUser = User::factory()->create(['status' => 'active']);
        $this->receptionistUser->roles()->attach($receptionistRole);

        $this->doctorUser = User::factory()->create(['status' => 'active']);
        $this->doctorUser->roles()->attach($doctorRole);

        $patient = Patient::create([
            'patient_number' => 'RC-2026-00999',
            'name' => 'Guardian Patient',
            'date_of_birth' => '2000-01-01',
            'gender' => 'male',
            'address' => 'Test',
            'status' => 'active',
        ]);

        $this->guardianUser = Guardian::create([
            'patient_id' => $patient->id,
            'name' => 'Guardian User',
            'relationship' => 'Parent',
            'phone' => '08011223344',
            'email' => 'guardian.test@example.com',
            'password' => 'secret123',
            'status' => 'active',
        ]);
    }

    /**
     * Test Admin can retrieve dashboard statistics.
     */
    public function test_admin_can_retrieve_dashboard_statistics(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/dashboard/summary');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'patients' => ['total_registered', 'currently_admitted', 'active_sessions', 'discharged'],
                'appointments' => ['pending', 'approved', 'today', 'completed'],
                'billing' => ['total_invoiced', 'total_collected', 'outstanding_balance', 'partially_paid_count', 'overdue_count'],
                'medications' => ['today_scheduled', 'today_given', 'today_missed', 'today_refused', 'today_cancelled'],
                'guardians' => ['total_conversations', 'unread_messages'],
                'generated_at',
            ]);
    }

    /**
     * Test Receptionist can retrieve permitted operational statistics.
     */
    public function test_receptionist_can_retrieve_permitted_operational_statistics(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $response = $this->getJson('/api/v1/dashboard/summary');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'patients',
                'appointments',
                'billing',
                'medications',
                'guardians',
            ]);
    }

    /**
     * Test unauthorized roles receive 403 on dashboard and reports.
     */
    public function test_unauthorized_roles_receive_403(): void
    {
        // 1. Unauthenticated visitor
        $this->getJson('/api/v1/dashboard/summary')->assertStatus(401);
        $this->getJson('/api/v1/reports/billing')->assertStatus(401);

        // 2. Doctor blocked from staff dashboard administrative summary
        Sanctum::actingAs($this->doctorUser);
        $this->getJson('/api/v1/dashboard/summary')->assertStatus(403);
        $this->getJson('/api/v1/reports/billing')->assertStatus(403);

        // 3. Guardian blocked from staff dashboard and reports
        Sanctum::actingAs($this->guardianUser, ['guardians']);
        $this->getJson('/api/v1/dashboard/summary')->assertStatus(403);
        $this->getJson('/api/v1/reports/patients')->assertStatus(403);
    }

    /**
     * Test dashboard statistics accurately reflect real database records.
     */
    public function test_dashboard_statistics_reflect_real_database_records(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Seed 1 active patient with admission and active session
        $patient = Patient::create([
            'patient_number' => 'RC-2026-00050',
            'name' => 'Real Data Patient',
            'date_of_birth' => '1992-05-15',
            'gender' => 'male',
            'address' => 'Enugu State',
            'status' => 'active',
        ]);

        Admission::create([
            'patient_id' => $patient->id,
            'admission_date' => now()->toDateString(),
            'admission_type' => 'voluntary',
            'admitted_by' => $this->adminUser->id,
            'status' => 'active',
        ]);

        $session = TreatmentSession::create([
            'patient_id' => $patient->id,
            'session_number' => 1,
            'session_price' => 300000.00,
            'start_date' => now()->toDateString(),
            'expected_end_date' => now()->addDays(30)->toDateString(),
            'status' => 'active',
            'payment_status' => 'partially_paid',
        ]);

        // Seed appointment
        Appointment::factory()->create([
            'patient_id' => $patient->id,
            'status' => Appointment::STATUS_PENDING,
            'scheduled_at' => now(),
            'visitor_name' => 'John Visitor',
        ]);

        // Seed invoice and payment
        $invoice = Invoice::create([
            'patient_id' => $patient->id,
            'treatment_session_id' => $session->id,
            'invoice_number' => 'INV-2026-00050',
            'amount' => 300000.00,
            'amount_paid' => 100000.00,
            'balance' => 200000.00,
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => Invoice::STATUS_PARTIALLY_PAID,
            'created_by' => $this->adminUser->id,
        ]);

        Payment::create([
            'patient_id' => $patient->id,
            'invoice_id' => $invoice->id,
            'reference' => 'PAY-REAL-001',
            'amount' => 100000.00,
            'method' => 'bank_transfer',
            'status' => Payment::STATUS_SUCCESSFUL,
            'paid_at' => now(),
            'recorded_by' => $this->adminUser->id,
        ]);

        $response = $this->getJson('/api/v1/dashboard/summary');
        $response->assertStatus(200);

        $data = $response->json();

        $this->assertGreaterThanOrEqual(1, $data['patients']['currently_admitted']);
        $this->assertGreaterThanOrEqual(1, $data['patients']['active_sessions']);
        $this->assertGreaterThanOrEqual(1, $data['appointments']['pending']);
        $this->assertEquals(300000.00, $data['billing']['total_invoiced']);
        $this->assertEquals(100000.00, $data['billing']['total_collected']);
        $this->assertEquals(200000.00, $data['billing']['outstanding_balance']);
        $this->assertEquals(1, $data['billing']['partially_paid_count']);
    }

    /**
     * Test operational alerts identify expiring sessions, overdue invoices, and pending actions.
     */
    public function test_operational_alerts_identify_expiring_sessions_and_overdue_invoices(): void
    {
        Sanctum::actingAs($this->adminUser);

        $patient = Patient::create([
            'patient_number' => 'RC-2026-00051',
            'name' => 'Alert Patient',
            'date_of_birth' => '1990-01-01',
            'gender' => 'female',
            'address' => 'Awka',
            'status' => 'active',
        ]);

        // Session ending in 2 days
        TreatmentSession::create([
            'patient_id' => $patient->id,
            'session_number' => 1,
            'start_date' => now()->subDays(28)->toDateString(),
            'expected_end_date' => now()->addDays(2)->toDateString(),
            'status' => 'active',
        ]);

        // Overdue invoice
        Invoice::create([
            'patient_id' => $patient->id,
            'invoice_number' => 'INV-2026-OVERDUE',
            'amount' => 200000.00,
            'amount_paid' => 0.00,
            'balance' => 200000.00,
            'due_date' => now()->subDays(3)->toDateString(),
            'status' => Invoice::STATUS_OVERDUE,
            'created_by' => $this->adminUser->id,
        ]);

        // Unread guardian message
        GuardianMessage::create([
            'patient_id' => $patient->id,
            'guardian_id' => $this->guardianUser->id,
            'sender_user_id' => null,
            'message' => 'Please how is my patient doing today?',
            'read_at' => null,
        ]);

        $response = $this->getJson('/api/v1/dashboard/alerts');
        $response->assertStatus(200);

        $alerts = collect($response->json('alerts'));

        $this->assertTrue($alerts->contains('type', 'session_expiring'));
        $this->assertTrue($alerts->contains('type', 'overdue_invoice'));
        $this->assertTrue($alerts->contains('type', 'unread_message'));
    }

    /**
     * Test reports enforce strict role restrictions.
     */
    public function test_reports_enforce_role_restrictions(): void
    {
        // 1. Admin can access all reports
        Sanctum::actingAs($this->adminUser);
        $this->getJson('/api/v1/reports/patients')->assertStatus(200);
        $this->getJson('/api/v1/reports/treatment-sessions')->assertStatus(200);
        $this->getJson('/api/v1/reports/billing')->assertStatus(200);
        $this->getJson('/api/v1/reports/payments')->assertStatus(200);
        $this->getJson('/api/v1/reports/medications')->assertStatus(200);
        $this->getJson('/api/v1/reports/appointments')->assertStatus(200);

        // 2. Receptionist can access operational reports
        Sanctum::actingAs($this->receptionistUser);
        $this->getJson('/api/v1/reports/patients')->assertStatus(200);
        $this->getJson('/api/v1/reports/treatment-sessions')->assertStatus(200);
        $this->getJson('/api/v1/reports/billing')->assertStatus(200);
        $this->getJson('/api/v1/reports/payments')->assertStatus(200);
        $this->getJson('/api/v1/reports/appointments')->assertStatus(200);

        // 3. Receptionist is BLOCKED from clinical medication administration report
        $this->getJson('/api/v1/reports/medications')->assertStatus(403);
    }

    /**
     * Test pricing configuration can be retrieved and updated by Admin.
     */
    public function test_pricing_configuration_can_be_updated_by_admin(): void
    {
        Sanctum::actingAs($this->adminUser);

        // GET current
        $getRes = $this->getJson('/api/v1/pricing-config');
        $getRes->assertStatus(200)
            ->assertJsonPath('config.initial_session_price', '300000.00')
            ->assertJsonPath('config.subsequent_session_price', '200000.00');

        // PUT update
        $updateRes = $this->putJson('/api/v1/pricing-config', [
            'initial_session_price' => 350000.00,
            'subsequent_session_price' => 220000.00,
            'currency' => 'NGN',
            'session_duration_days' => 30,
        ]);

        $updateRes->assertStatus(200)
            ->assertJsonPath('config.initial_session_price', '350000.00')
            ->assertJsonPath('config.subsequent_session_price', '220000.00');

        $this->assertDatabaseHas('treatment_pricing_configs', [
            'initial_session_price' => 350000.00,
            'subsequent_session_price' => 220000.00,
            'updated_by' => $this->adminUser->id,
        ]);
    }

    /**
     * Test Receptionist cannot modify pricing.
     */
    public function test_receptionist_cannot_modify_pricing(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        // Receptionist can view pricing config
        $this->getJson('/api/v1/pricing-config')->assertStatus(200);

        // Receptionist cannot update pricing config (403)
        $response = $this->putJson('/api/v1/pricing-config', [
            'initial_session_price' => 400000.00,
            'subsequent_session_price' => 250000.00,
            'currency' => 'NGN',
            'session_duration_days' => 30,
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test initial session uses initial pricing automatically on admission and invoice creation.
     */
    public function test_initial_session_uses_initial_pricing(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $patient = Patient::create([
            'patient_number' => 'RC-2026-00088',
            'name' => 'Initial Pricing Patient',
            'date_of_birth' => '1998-04-04',
            'gender' => 'male',
            'address' => 'Enugu',
            'status' => 'registered',
        ]);

        // Admit patient -> spawns Session 1
        $admitRes = $this->postJson("/api/v1/patients/{$patient->id}/admission", [
            'admission_date' => now()->toDateString(),
            'admission_type' => 'voluntary',
        ]);
        $admitRes->assertStatus(201);

        $session = TreatmentSession::where('patient_id', $patient->id)->where('session_number', 1)->first();
        $this->assertNotNull($session);
        $this->assertEquals('300000.00', $session->session_price);

        // Generate invoice linking session 1 without passing amount -> automatically uses 300,000
        $invoiceRes = $this->postJson('/api/v1/invoices', [
            'patient_id' => $patient->id,
            'treatment_session_id' => $session->id,
            'due_date' => now()->addDays(7)->toDateString(),
            'notes' => 'Session 1 treatment invoice',
        ]);

        $invoiceRes->assertStatus(201)
            ->assertJsonPath('invoice.amount', '300000.00')
            ->assertJsonPath('invoice.balance', '300000.00');
    }

    /**
     * Test subsequent session uses subsequent pricing automatically on continue and invoice creation.
     */
    public function test_subsequent_sessions_use_subsequent_pricing(): void
    {
        Sanctum::actingAs($this->adminUser);

        $patient = Patient::create([
            'patient_number' => 'RC-2026-00089',
            'name' => 'Subsequent Pricing Patient',
            'date_of_birth' => '1997-03-03',
            'gender' => 'female',
            'address' => 'Onitsha',
            'status' => 'active',
        ]);

        // Create session 1
        $session1 = TreatmentSession::create([
            'patient_id' => $patient->id,
            'session_number' => 1,
            'session_price' => 300000.00,
            'start_date' => now()->subDays(30)->toDateString(),
            'expected_end_date' => now()->toDateString(),
            'status' => 'active',
            'recommendation' => 'continue',
            'reassessed_by' => $this->adminUser->id,
            'reassessed_at' => now(),
        ]);

        // Continue treatment -> spawns Session 2
        $continueRes = $this->postJson("/api/v1/sessions/{$session1->id}/continue");
        $continueRes->assertStatus(201);

        $session2 = TreatmentSession::where('patient_id', $patient->id)->where('session_number', 2)->first();
        $this->assertNotNull($session2);
        $this->assertEquals('200000.00', $session2->session_price);

        // Generate invoice linking session 2 without explicit amount -> automatically uses 200,000
        $invoiceRes = $this->postJson('/api/v1/invoices', [
            'patient_id' => $patient->id,
            'treatment_session_id' => $session2->id,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        $invoiceRes->assertStatus(201)
            ->assertJsonPath('invoice.amount', '200000.00')
            ->assertJsonPath('invoice.balance', '200000.00');
    }

    /**
     * Test historical invoices retain their original amount after Admin changes pricing.
     */
    public function test_historical_invoices_retain_their_original_amount_after_pricing_changes(): void
    {
        Sanctum::actingAs($this->adminUser);

        $patient = Patient::create([
            'patient_number' => 'RC-2026-00090',
            'name' => 'Historical Invoice Patient',
            'date_of_birth' => '1995-01-01',
            'gender' => 'male',
            'address' => 'Enugu',
            'status' => 'active',
        ]);

        $session = TreatmentSession::create([
            'patient_id' => $patient->id,
            'session_number' => 1,
            'session_price' => 300000.00,
            'start_date' => now()->toDateString(),
            'expected_end_date' => now()->addDays(30)->toDateString(),
            'status' => 'active',
        ]);

        // Create historical invoice at initial 300,000
        $invoiceRes = $this->postJson('/api/v1/invoices', [
            'patient_id' => $patient->id,
            'treatment_session_id' => $session->id,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);
        $invoiceId = $invoiceRes->json('invoice.id');

        // Admin updates pricing configuration: initial session price increased to 500,000
        $this->putJson('/api/v1/pricing-config', [
            'initial_session_price' => 500000.00,
            'subsequent_session_price' => 350000.00,
            'currency' => 'NGN',
            'session_duration_days' => 30,
        ])->assertStatus(200);

        // Historical invoice MUST still have amount 300,000
        $historicalInvoice = Invoice::findOrFail($invoiceId);
        $this->assertEquals('300000.00', $historicalInvoice->amount);
        $this->assertEquals('300000.00', $historicalInvoice->balance);
    }

    /**
     * Test invalid pricing configuration values are rejected.
     */
    public function test_invalid_pricing_values_are_rejected(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Negative price
        $res1 = $this->putJson('/api/v1/pricing-config', [
            'initial_session_price' => -500.00,
            'subsequent_session_price' => 200000.00,
            'currency' => 'NGN',
            'session_duration_days' => 30,
        ]);
        $res1->assertStatus(422)->assertJsonValidationErrors(['initial_session_price']);

        // Zero session duration
        $res2 = $this->putJson('/api/v1/pricing-config', [
            'initial_session_price' => 300000.00,
            'subsequent_session_price' => 200000.00,
            'currency' => 'NGN',
            'session_duration_days' => 0,
        ]);
        $res2->assertStatus(422)->assertJsonValidationErrors(['session_duration_days']);

        // Non-numeric price
        $res3 = $this->putJson('/api/v1/pricing-config', [
            'initial_session_price' => 'free',
            'subsequent_session_price' => 200000.00,
            'currency' => 'NGN',
            'session_duration_days' => 30,
        ]);
        $res3->assertStatus(422)->assertJsonValidationErrors(['initial_session_price']);
    }

    /**
     * Test operational treatment sessions overview endpoint supports filtering and approaching end detection.
     */
    public function test_treatment_sessions_overview_supports_monitoring(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $patient = Patient::create([
            'patient_number' => 'RC-2026-00091',
            'name' => 'Overview Patient',
            'date_of_birth' => '1994-01-01',
            'gender' => 'male',
            'address' => 'Enugu',
            'status' => 'active',
        ]);

        TreatmentSession::create([
            'patient_id' => $patient->id,
            'session_number' => 1,
            'session_price' => 300000.00,
            'start_date' => now()->subDays(25)->toDateString(),
            'expected_end_date' => now()->addDays(5)->toDateString(),
            'status' => 'active',
            'payment_status' => 'unpaid',
        ]);

        $response = $this->getJson('/api/v1/treatment-sessions?status=active&approaching_end=1');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.is_approaching_end', true)
            ->assertJsonPath('data.0.session_number', 1);
    }
}
