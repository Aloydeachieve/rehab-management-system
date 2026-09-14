<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\Invoice;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Role;
use App\Models\TreatmentSession;
use App\Models\User;
use App\Notifications\InvoiceCreatedNotification;
use App\Notifications\PaymentReceivedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BillingPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $doctorUser;
    protected Guardian $guardian;
    protected Patient $patientA;
    protected Patient $patientB;
    protected TreatmentSession $sessionA;
    protected TreatmentSession $sessionB;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        $adminRole = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Admin']);
        $receptionistRole = Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Receptionist']);
        $doctorRole = Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Doctor']);

        // Create staff users
        $this->adminUser = User::factory()->create(['status' => 'active']);
        $this->adminUser->roles()->attach($adminRole);

        $this->receptionistUser = User::factory()->create(['status' => 'active']);
        $this->receptionistUser->roles()->attach($receptionistRole);

        $this->doctorUser = User::factory()->create(['status' => 'active']);
        $this->doctorUser->roles()->attach($doctorRole);

        // Create patients
        $this->patientA = Patient::create([
            'patient_number' => 'RC-2026-00100',
            'name' => 'Michael Scott',
            'date_of_birth' => '1975-03-15',
            'gender' => 'male',
            'address' => '1725 Slough Ave, Scranton',
            'status' => 'active',
        ]);

        $this->patientB = Patient::create([
            'patient_number' => 'RC-2026-00200',
            'name' => 'Jim Halpert',
            'date_of_birth' => '1980-10-01',
            'gender' => 'male',
            'address' => '421 Penn Ave, Scranton',
            'status' => 'active',
        ]);

        // Create guardian
        $this->guardian = Guardian::create([
            'patient_id' => $this->patientA->id,
            'name' => 'Holly Flax',
            'relationship' => 'Spouse',
            'phone' => '+15705550199',
            'email' => 'holly.flax@example.com',
            'status' => 'active',
            'is_primary' => true,
        ]);

        // Create treatment sessions
        $this->sessionA = TreatmentSession::create([
            'patient_id' => $this->patientA->id,
            'session_number' => 1,
            'start_date' => now()->toDateString(),
            'expected_end_date' => now()->addDays(30)->toDateString(),
            'status' => 'active',
            'payment_status' => 'unpaid',
        ]);

        $this->sessionB = TreatmentSession::create([
            'patient_id' => $this->patientB->id,
            'session_number' => 1,
            'start_date' => now()->toDateString(),
            'expected_end_date' => now()->addDays(30)->toDateString(),
            'status' => 'active',
            'payment_status' => 'unpaid',
        ]);
    }

    /**
     * 1. Admin can create invoice for a treatment session.
     */
    public function test_admin_can_create_invoice_for_treatment_session(): void
    {
        Notification::fake();
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/invoices', [
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'amount' => 250000.00,
            'due_date' => now()->addDays(14)->toDateString(),
            'notes' => '30-Day Residential Program Fee',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('invoice.patient_id', $this->patientA->id)
            ->assertJsonPath('invoice.treatment_session_id', $this->sessionA->id)
            ->assertJsonPath('invoice.amount', '250000.00')
            ->assertJsonPath('invoice.amount_paid', '0.00')
            ->assertJsonPath('invoice.balance', '250000.00')
            ->assertJsonPath('invoice.status', 'unpaid');

        $this->assertDatabaseHas('invoices', [
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'amount' => 250000.00,
            'balance' => 250000.00,
            'status' => 'unpaid',
        ]);

        Notification::assertSentTo($this->guardian, InvoiceCreatedNotification::class);
    }

    /**
     * 2. Receptionist can create invoice.
     */
    public function test_receptionist_can_create_invoice(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $response = $this->postJson('/api/v1/invoices', [
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'amount' => 150000.00,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        $response->assertStatus(201);
    }

    /**
     * 3. Unauthorized roles cannot create invoices (Doctor, Guardian, Unauthenticated).
     */
    public function test_unauthorized_roles_cannot_create_invoices(): void
    {
        // Doctor receives 403
        Sanctum::actingAs($this->doctorUser);
        $resDoctor = $this->postJson('/api/v1/invoices', [
            'patient_id' => $this->patientA->id,
            'amount' => 100000.00,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);
        $resDoctor->assertStatus(403);

        // Guardian receives 403
        Sanctum::actingAs($this->guardian, ['guardian']);
        $resGuardian = $this->postJson('/api/v1/invoices', [
            'patient_id' => $this->patientA->id,
            'amount' => 100000.00,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);
        $resGuardian->assertStatus(403);
    }

    /**
     * 3b. Unauthenticated visitors receive 401.
     */
    public function test_unauthenticated_visitors_cannot_create_invoices(): void
    {
        $resAnon = $this->postJson('/api/v1/invoices', [
            'patient_id' => $this->patientA->id,
            'amount' => 100000.00,
            'due_date' => now()->addDays(7)->toDateString(),
        ]);
        $resAnon->assertStatus(401);
    }

    /**
     * 4. Cross-patient treatment session is rejected.
     */
    public function test_cross_patient_treatment_session_is_rejected(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Attempting to attach patient B's session to patient A's invoice
        $response = $this->postJson('/api/v1/invoices', [
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionB->id,
            'amount' => 200000.00,
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['treatment_session_id']);
    }

    /**
     * 5. Duplicate active invoice for the same treatment session is rejected.
     */
    public function test_duplicate_active_invoice_for_treatment_session_is_rejected(): void
    {
        Sanctum::actingAs($this->adminUser);

        Invoice::create([
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'invoice_number' => 'INV-2026-00001',
            'amount' => 250000.00,
            'amount_paid' => 0.00,
            'balance' => 250000.00,
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'unpaid',
        ]);

        $response = $this->postJson('/api/v1/invoices', [
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'amount' => 250000.00,
            'due_date' => now()->addDays(14)->toDateString(),
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['treatment_session_id']);
    }

    /**
     * 6. Invoice number is generated server-side.
     */
    public function test_invoice_number_is_generated_server_side(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/invoices', [
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'invoice_number' => 'CUSTOM-HACKED-NUMBER', // Should be ignored/overridden
            'amount' => 300000.00,
            'due_date' => now()->addDays(10)->toDateString(),
        ]);

        $response->assertStatus(201);
        $invoiceNumber = $response->json('invoice.invoice_number');
        $this->assertStringStartsWith('INV-' . now()->year, $invoiceNumber);
        $this->assertNotEquals('CUSTOM-HACKED-NUMBER', $invoiceNumber);
    }

    /**
     * 7. Staff can record payment and invoice balance updates.
     */
    public function test_staff_can_record_payment_and_balance_updates(): void
    {
        Notification::fake();
        Sanctum::actingAs($this->receptionistUser);

        $invoice = Invoice::create([
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'invoice_number' => 'INV-2026-00002',
            'amount' => 200000.00,
            'amount_paid' => 0.00,
            'balance' => 200000.00,
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'unpaid',
        ]);

        $response = $this->postJson('/api/v1/payments', [
            'invoice_id' => $invoice->id,
            'amount' => 100000.00,
            'method' => 'bank_transfer',
            'reference' => 'TRF-12345678',
            'notes' => 'Part-payment via GTBank transfer',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('payment.amount', '100000.00')
            ->assertJsonPath('payment.status', 'successful')
            ->assertJsonPath('invoice.amount_paid', '100000.00')
            ->assertJsonPath('invoice.balance', '100000.00')
            ->assertJsonPath('invoice.status', 'partially_paid');

        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'reference' => 'TRF-12345678',
            'amount' => 100000.00,
            'status' => 'successful',
        ]);

        $this->assertEquals('partially_paid', $this->sessionA->fresh()->payment_status);

        Notification::assertSentTo($this->guardian, PaymentReceivedNotification::class);
    }

    /**
     * 8. Full payment marks invoice as paid and balance as 0.
     */
    public function test_full_payment_marks_invoice_as_paid(): void
    {
        Sanctum::actingAs($this->adminUser);

        $invoice = Invoice::create([
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'invoice_number' => 'INV-2026-00003',
            'amount' => 150000.00,
            'amount_paid' => 0.00,
            'balance' => 150000.00,
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'unpaid',
        ]);

        $response = $this->postJson('/api/v1/payments', [
            'invoice_id' => $invoice->id,
            'amount' => 150000.00,
            'method' => 'pos',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('invoice.amount_paid', '150000.00')
            ->assertJsonPath('invoice.balance', '0.00')
            ->assertJsonPath('invoice.status', 'paid');

        $this->assertEquals('paid', $this->sessionA->fresh()->payment_status);
    }

    /**
     * 9. Overpayment exceeding remaining balance is rejected.
     */
    public function test_overpayment_exceeding_balance_is_rejected(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $invoice = Invoice::create([
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'invoice_number' => 'INV-2026-00004',
            'amount' => 100000.00,
            'amount_paid' => 50000.00,
            'balance' => 50000.00,
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'partially_paid',
        ]);

        // Attempting to pay 60000 when balance is 50000
        $response = $this->postJson('/api/v1/payments', [
            'invoice_id' => $invoice->id,
            'amount' => 60000.00,
            'method' => 'cash',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    /**
     * 10. Payment cannot be applied to another patient's invoice.
     */
    public function test_payment_cannot_be_applied_to_mismatched_patient(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $invoiceA = Invoice::create([
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'invoice_number' => 'INV-2026-00005',
            'amount' => 100000.00,
            'amount_paid' => 0.00,
            'balance' => 100000.00,
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'unpaid',
        ]);

        $response = $this->postJson('/api/v1/payments', [
            'invoice_id' => $invoiceA->id,
            'patient_id' => $this->patientB->id, // Mismatched patient
            'amount' => 50000.00,
            'method' => 'cash',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['patient_id']);
    }

    /**
     * 11. Duplicate payment references are rejected.
     */
    public function test_duplicate_payment_references_are_rejected(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $invoice = Invoice::create([
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'invoice_number' => 'INV-2026-00006',
            'amount' => 200000.00,
            'amount_paid' => 0.00,
            'balance' => 200000.00,
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'unpaid',
        ]);

        Payment::create([
            'patient_id' => $this->patientA->id,
            'invoice_id' => $invoice->id,
            'reference' => 'DUPLICATE-REF-100',
            'amount' => 50000.00,
            'method' => 'cash',
            'status' => 'successful',
        ]);

        $response = $this->postJson('/api/v1/payments', [
            'invoice_id' => $invoice->id,
            'amount' => 50000.00,
            'method' => 'cash',
            'reference' => 'DUPLICATE-REF-100',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['reference']);
    }

    /**
     * 12. Payment webhook idempotently processes provider callbacks and updates invoice balance.
     */
    public function test_payment_webhook_idempotently_processes_callbacks(): void
    {
        $invoice = Invoice::create([
            'patient_id' => $this->patientA->id,
            'treatment_session_id' => $this->sessionA->id,
            'invoice_number' => 'INV-2026-00007',
            'amount' => 180000.00,
            'amount_paid' => 0.00,
            'balance' => 180000.00,
            'due_date' => now()->addDays(14)->toDateString(),
            'status' => 'unpaid',
        ]);

        $payload = [
            'event' => 'charge.success',
            'reference' => 'PAYSTACK-TX-998877',
            'amount' => 180000.00,
            'provider' => 'paystack',
            'metadata' => [
                'invoice_id' => $invoice->id,
                'patient_id' => $this->patientA->id,
            ],
        ];

        // First callback creates payment and marks invoice paid
        $response1 = $this->postJson('/api/v1/payments/webhook', $payload);
        $response1->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('payments', [
            'invoice_id' => $invoice->id,
            'reference' => 'PAYSTACK-TX-998877',
            'amount' => 180000.00,
            'status' => 'successful',
        ]);

        $this->assertEquals('0.00', $invoice->fresh()->balance);
        $this->assertEquals('paid', $invoice->fresh()->status);

        // Duplicate webhook call is handled idempotently without duplicate payments
        $response2 = $this->postJson('/api/v1/payments/webhook', $payload);
        $response2->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertEquals(1, Payment::where('reference', 'PAYSTACK-TX-998877')->count());
    }

    /**
     * 13. Doctors cannot access billing or payments endpoints.
     */
    public function test_doctors_cannot_access_billing_endpoints(): void
    {
        Sanctum::actingAs($this->doctorUser);

        $this->getJson('/api/v1/invoices')->assertStatus(403);
        $this->getJson('/api/v1/payments')->assertStatus(403);
    }

    /**
     * 14. Guardians cannot access internal staff billing endpoints.
     */
    public function test_guardians_cannot_access_staff_billing_endpoints(): void
    {
        Sanctum::actingAs($this->guardian, ['guardian']);

        $this->getJson('/api/v1/invoices')->assertStatus(403);
        $this->getJson('/api/v1/payments')->assertStatus(403);
    }
}
