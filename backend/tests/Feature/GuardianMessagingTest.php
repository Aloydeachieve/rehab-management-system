<?php

namespace Tests\Feature;

use App\Models\Guardian;
use App\Models\GuardianMessage;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GuardianMessagingTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $doctorUser;
    protected Patient $patientA;
    protected Patient $patientB;
    protected Guardian $guardianA;
    protected Guardian $guardianB;

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
            'patient_number' => 'RC-2026-00010',
            'name' => 'John Doe',
            'date_of_birth' => '1998-05-15',
            'gender' => 'male',
            'address' => '123 Main St',
            'status' => 'active',
        ]);

        $this->patientB = Patient::create([
            'patient_number' => 'RC-2026-00020',
            'name' => 'Peter Parker',
            'date_of_birth' => '2001-08-20',
            'gender' => 'male',
            'address' => '456 Elm St',
            'status' => 'active',
        ]);

        // Create guardians with hashed passwords
        $this->guardianA = Guardian::create([
            'patient_id' => $this->patientA->id,
            'name' => 'Jane Doe',
            'relationship' => 'Mother',
            'phone' => '+1234567890',
            'email' => 'jane.doe@example.com',
            'password' => Hash::make('Secret123!'),
            'status' => 'active',
            'is_primary' => true,
        ]);

        $this->guardianB = Guardian::create([
            'patient_id' => $this->patientB->id,
            'name' => 'May Parker',
            'relationship' => 'Aunt',
            'phone' => '+1987654321',
            'email' => 'may.parker@example.com',
            'password' => Hash::make('Secret123!'),
            'status' => 'active',
            'is_primary' => true,
        ]);
    }

    /**
     * 1. Guardian can authenticate.
     */
    public function test_guardian_can_authenticate(): void
    {
        $response = $this->postJson('/api/v1/guardian/login', [
            'email' => 'jane.doe@example.com',
            'password' => 'Secret123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'token',
                'guardian' => [
                    'id',
                    'name',
                    'email',
                    'relationship',
                    'patients',
                ],
            ]);

        $this->assertEquals('Jane Doe', $response->json('guardian.name'));
        $this->assertEquals($this->patientA->id, $response->json('guardian.patients.0.id'));
    }

    /**
     * 2. Invalid guardian credentials are rejected.
     */
    public function test_invalid_guardian_credentials_are_rejected(): void
    {
        $response = $this->postJson('/api/v1/guardian/login', [
            'email' => 'jane.doe@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    /**
     * 3. Guardian can send a message.
     */
    public function test_guardian_can_send_message(): void
    {
        Sanctum::actingAs($this->guardianA, ['guardian']);

        $response = $this->postJson('/api/v1/guardian/messages', [
            'patient_id' => $this->patientA->id,
            'message' => 'Please can I know how my son is doing?',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.sender_type', 'guardian')
            ->assertJsonPath('data.message', 'Please can I know how my son is doing?');

        $this->assertDatabaseHas('guardian_messages', [
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => null,
            'message' => 'Please can I know how my son is doing?',
        ]);
    }

    /**
     * 4. Guardian can view their own conversation.
     */
    public function test_guardian_can_view_their_own_conversation(): void
    {
        GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => null,
            'message' => 'Hello from Jane',
        ]);

        Sanctum::actingAs($this->guardianA, ['guardian']);

        $response = $this->getJson("/api/v1/guardian/messages?patient_id={$this->patientA->id}");

        $response->assertStatus(200)
            ->assertJsonCount(1, 'messages')
            ->assertJsonPath('messages.0.message', 'Hello from Jane');
    }

    /**
     * 5. Guardian cannot view another guardian's conversation.
     */
    public function test_guardian_cannot_view_another_guardians_conversation(): void
    {
        Sanctum::actingAs($this->guardianA, ['guardian']);

        $response = $this->getJson("/api/v1/guardian/messages?patient_id={$this->patientB->id}");

        $response->assertStatus(403);
    }

    /**
     * 6. Guardian cannot send a message for an unrelated patient.
     */
    public function test_guardian_cannot_send_message_for_unrelated_patient(): void
    {
        Sanctum::actingAs($this->guardianA, ['guardian']);

        $response = $this->postJson('/api/v1/guardian/messages', [
            'patient_id' => $this->patientB->id,
            'message' => 'Sneaking into another conversation',
        ]);

        $response->assertStatus(403);
    }

    /**
     * 7. Receptionist can view guardian conversations.
     */
    public function test_receptionist_can_view_guardian_conversations(): void
    {
        GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => null,
            'message' => 'Inquiry from Jane',
        ]);

        Sanctum::actingAs($this->receptionistUser);

        $response = $this->getJson('/api/v1/messages');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'conversations')
            ->assertJsonPath('conversations.0.guardian_name', 'Jane Doe')
            ->assertJsonPath('conversations.0.patient_name', 'John Doe')
            ->assertJsonPath('conversations.0.relationship', 'Mother');
    }

    /**
     * 8. Receptionist can reply to a guardian.
     */
    public function test_receptionist_can_reply_to_guardian(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $response = $this->postJson("/api/v1/patients/{$this->patientA->id}/messages", [
            'guardian_id' => $this->guardianA->id,
            'message' => 'He is currently doing well and the team will continue monitoring his progress.',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.sender_type', 'staff')
            ->assertJsonPath('data.sender_user_id', $this->receptionistUser->id);

        $this->assertDatabaseHas('guardian_messages', [
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => $this->receptionistUser->id,
        ]);
    }

    /**
     * 9. Guardian can see receptionist replies.
     */
    public function test_guardian_can_see_receptionist_replies(): void
    {
        GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => $this->receptionistUser->id,
            'message' => 'Visiting hours are 2 PM to 5 PM.',
        ]);

        Sanctum::actingAs($this->guardianA, ['guardian']);

        $response = $this->getJson("/api/v1/guardian/messages?patient_id={$this->patientA->id}");

        $response->assertStatus(200)
            ->assertJsonPath('messages.0.sender_type', 'staff')
            ->assertJsonPath('messages.0.message', 'Visiting hours are 2 PM to 5 PM.');
    }

    /**
     * 10. Messages preserve chronological history.
     */
    public function test_messages_preserve_chronological_history(): void
    {
        $msg1 = GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => null,
            'message' => 'First message',
            'created_at' => now()->subMinutes(10),
        ]);

        $msg2 = GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => $this->receptionistUser->id,
            'message' => 'Second reply',
            'created_at' => now()->subMinutes(5),
        ]);

        Sanctum::actingAs($this->guardianA, ['guardian']);

        $response = $this->getJson("/api/v1/guardian/messages?patient_id={$this->patientA->id}");

        $response->assertStatus(200);
        $this->assertEquals('First message', $response->json('messages.0.message'));
        $this->assertEquals('Second reply', $response->json('messages.1.message'));
    }

    /**
     * 11. Read state transitions work.
     */
    public function test_read_state_transitions_work(): void
    {
        $guardianMsg = GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => null,
            'message' => 'Unread message from guardian',
            'read_at' => null,
        ]);

        // Receptionist marks guardian message as read
        Sanctum::actingAs($this->receptionistUser);
        $this->patchJson("/api/v1/messages/{$guardianMsg->id}/read")->assertStatus(200);

        $this->assertNotNull($guardianMsg->fresh()->read_at);

        // Staff reply
        $staffMsg = GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => $this->receptionistUser->id,
            'message' => 'Unread reply from receptionist',
            'read_at' => null,
        ]);

        // Guardian marks staff reply as read
        Sanctum::actingAs($this->guardianA, ['guardian']);
        $this->patchJson("/api/v1/guardian/messages/{$staffMsg->id}/read")->assertStatus(200);

        $this->assertNotNull($staffMsg->fresh()->read_at);
    }

    /**
     * 12. Unread conversations are correctly identified and counted.
     */
    public function test_unread_conversations_are_correctly_identified(): void
    {
        // 2 unread messages from Guardian A
        GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => null,
            'message' => 'Msg 1',
            'read_at' => null,
        ]);

        GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => null,
            'message' => 'Msg 2',
            'read_at' => null,
        ]);

        Sanctum::actingAs($this->receptionistUser);

        $response = $this->getJson('/api/v1/messages');

        $response->assertStatus(200)
            ->assertJsonPath('conversations.0.unread_count', 2);
    }

    /**
     * 13. Doctor cannot access receptionist guardian inbox by default.
     */
    public function test_doctor_cannot_access_receptionist_guardian_inbox_by_default(): void
    {
        Sanctum::actingAs($this->doctorUser);

        $response = $this->getJson('/api/v1/messages');
        $response->assertStatus(403);

        $response2 = $this->getJson("/api/v1/patients/{$this->patientA->id}/messages");
        $response2->assertStatus(403);
    }

    /**
     * 14. Admin can oversee guardian conversations.
     */
    public function test_admin_can_oversee_guardian_conversations(): void
    {
        GuardianMessage::create([
            'patient_id' => $this->patientA->id,
            'guardian_id' => $this->guardianA->id,
            'sender_user_id' => null,
            'message' => 'Admin oversight test',
        ]);

        Sanctum::actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/messages');
        $response->assertStatus(200)
            ->assertJsonPath('conversations.0.patient_name', 'John Doe');

        $reply = $this->postJson("/api/v1/patients/{$this->patientA->id}/messages", [
            'guardian_id' => $this->guardianA->id,
            'message' => 'Administrator response',
        ]);
        $reply->assertStatus(201);
    }

    /**
     * 15. Unauthenticated visitors cannot send messages.
     */
    public function test_unauthenticated_visitors_cannot_send_messages(): void
    {
        $response = $this->postJson('/api/v1/guardian/messages', [
            'patient_id' => $this->patientA->id,
            'message' => 'Anonymous spam attempt',
        ]);

        $response->assertStatus(401);
    }

    /**
     * 16. Guardian cannot access clinical patient endpoints.
     */
    public function test_guardian_cannot_access_clinical_patient_endpoints(): void
    {
        Sanctum::actingAs($this->guardianA, ['guardian']);

        $clinicalEndpoints = [
            "/api/v1/patients/{$this->patientA->id}/medical-history",
            "/api/v1/patients/{$this->patientA->id}/assessments",
            "/api/v1/patients/{$this->patientA->id}/vital-signs",
            "/api/v1/patients/{$this->patientA->id}/clinical-notes",
            "/api/v1/patients/{$this->patientA->id}/prescriptions",
            "/api/v1/patients/{$this->patientA->id}/treatment-plans",
            "/api/v1/patients/{$this->patientA->id}/progress-notes",
        ];

        foreach ($clinicalEndpoints as $endpoint) {
            $response = $this->getJson($endpoint);
            $response->assertStatus(403);
        }
    }

    /**
     * 17. Guardian cannot access staff dashboard endpoints.
     */
    public function test_guardian_cannot_access_staff_dashboard_endpoints(): void
    {
        Sanctum::actingAs($this->guardianA, ['guardian']);

        $staffEndpoints = [
            '/api/v1/users',
            '/api/v1/patients',
            "/api/v1/patients/{$this->patientA->id}",
            '/api/v1/appointments',
            '/api/v1/admissions',
            '/api/v1/medication-administrations',
            '/api/v1/messages',
        ];

        foreach ($staffEndpoints as $endpoint) {
            $response = $this->getJson($endpoint);
            $response->assertStatus(403);
        }
    }

    /**
     * 18. Guardian account activation flow with patient number and email verification.
     */
    public function test_guardian_can_activate_account_with_patient_number_and_email(): void
    {
        // Unactivated guardian without password
        $unactivatedGuardian = Guardian::create([
            'patient_id' => $this->patientA->id,
            'name' => 'John Senior Doe',
            'relationship' => 'Father',
            'phone' => '+111222333',
            'email' => 'john.sr@example.com',
            'password' => null,
            'status' => 'active',
            'is_primary' => false,
        ]);

        $response = $this->postJson('/api/v1/guardian/activate', [
            'email' => 'john.sr@example.com',
            'patient_number' => $this->patientA->patient_number,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token', 'guardian'])
            ->assertJsonPath('guardian.email', 'john.sr@example.com');

        $this->assertNotNull($unactivatedGuardian->fresh()->password);
        $this->assertTrue(Hash::check('NewPassword123!', $unactivatedGuardian->fresh()->password));
    }
}
