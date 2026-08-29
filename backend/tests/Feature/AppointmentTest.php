<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Role;
use App\Models\User;
use App\Notifications\AppointmentStatusChanged;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;
    protected User $doctorUser;

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

        $this->doctorUser = User::factory()->create(['status' => 'active']);
        $this->doctorUser->roles()->attach($doctorRole);
    }

    /**
     * Test public can request appointment.
     */
    public function test_public_can_request_appointment(): void
    {
        Notification::fake();

        $payload = [
            'visitor_name' => 'John Doe',
            'visitor_phone' => '+2348031234567',
            'visitor_email' => 'johndoe@example.com',
            'reason' => 'Consultation for drug addiction treatment.',
            'preferred_at' => now()->addDays(2)->setHour(10)->setMinute(0)->format('Y-m-d H:i:s'),
            'notes' => 'Looking for residential rehab information.',
        ];

        $response = $this->postJson('/api/v1/appointments', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Appointment request submitted successfully.')
            ->assertJsonStructure([
                'appointment' => [
                    'id',
                    'visitor_name',
                    'visitor_phone',
                    'visitor_email',
                    'reason',
                    'preferred_at',
                    'status',
                    'notes',
                ]
            ]);

        $this->assertDatabaseHas('appointments', [
            'visitor_name' => 'John Doe',
            'visitor_email' => 'johndoe@example.com',
            'status' => Appointment::STATUS_PENDING,
        ]);

        Notification::assertSentOnDemand(
            AppointmentStatusChanged::class,
            function ($notification, $channels, $notifiable) use ($payload) {
                return $notifiable->routes['mail'] === $payload['visitor_email'];
            }
        );
    }

    /**
     * Test public validation errors.
     */
    public function test_public_appointment_requires_fields(): void
    {
        $response = $this->postJson('/api/v1/appointments', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['visitor_name', 'visitor_phone', 'reason', 'preferred_at']);
    }

    /**
     * Test authenticated receptionist can list appointments.
     */
    public function test_staff_can_list_appointments(): void
    {
        Appointment::factory()->count(3)->create();

        Sanctum::actingAs($this->receptionistUser);

        $response = $this->getJson('/api/v1/appointments');

        $response->assertStatus(200)
            ->assertJsonCount(3, 'data');
    }

    /**
     * Test doctor cannot access/manage all appointments, but can access assigned ones.
     */
    public function test_doctor_appointment_authorization_rules(): void
    {
        // 1. Create appointments: 1 assigned to this doctor, 1 assigned to another doctor, 1 unassigned
        $assignedApp = Appointment::factory()->create([
            'assigned_staff_id' => $this->doctorUser->id,
            'visitor_name' => 'Assigned Visitor',
        ]);

        $doctorRole = Role::where('name', Role::DOCTOR)->first();
        $otherDoctor = User::factory()->create();
        $otherDoctor->roles()->attach($doctorRole);
        $otherApp = Appointment::factory()->create([
            'assigned_staff_id' => $otherDoctor->id,
            'visitor_name' => 'Other Doctor Visitor',
        ]);

        $unassignedApp = Appointment::factory()->create([
            'assigned_staff_id' => null,
            'visitor_name' => 'Unassigned Visitor',
        ]);

        Sanctum::actingAs($this->doctorUser);

        // 2. Doctor lists appointments: should only see the 1 assigned to them
        $listResponse = $this->getJson('/api/v1/appointments');
        $listResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $assignedApp->id);

        // 3. Doctor views their assigned appointment: should succeed (200)
        $viewAssignedResponse = $this->getJson("/api/v1/appointments/{$assignedApp->id}");
        $viewAssignedResponse->assertStatus(200);

        // 4. Doctor views another doctor's appointment: should be forbidden (403)
        $viewOtherResponse = $this->getJson("/api/v1/appointments/{$otherApp->id}");
        $viewOtherResponse->assertStatus(403);

        // 5. Doctor views unassigned appointment: should be forbidden (403)
        $viewUnassignedResponse = $this->getJson("/api/v1/appointments/{$unassignedApp->id}");
        $viewUnassignedResponse->assertStatus(403);

        // 6. Doctor tries to approve their assigned appointment: should be forbidden (403)
        $approveResponse = $this->patchJson("/api/v1/appointments/{$assignedApp->id}/approve");
        $approveResponse->assertStatus(403);
    }

    /**
     * Test receptionist can approve appointment.
     */
    public function test_receptionist_can_approve_appointment(): void
    {
        Notification::fake();

        $appointment = Appointment::factory()->create([
            'status' => Appointment::STATUS_PENDING,
            'visitor_email' => 'visitor@example.com',
        ]);

        Sanctum::actingAs($this->receptionistUser);

        $response = $this->patchJson("/api/v1/appointments/{$appointment->id}/approve", [
            'notes' => 'Approved and assigned slot.',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => Appointment::STATUS_APPROVED,
            'notes' => 'Approved and assigned slot.',
        ]);

        Notification::assertSentOnDemand(AppointmentStatusChanged::class);
    }

    /**
     * Test receptionist can reschedule appointment.
     */
    public function test_receptionist_can_reschedule_appointment(): void
    {
        Notification::fake();

        $appointment = Appointment::factory()->create([
            'status' => Appointment::STATUS_PENDING,
            'visitor_email' => 'visitor@example.com',
        ]);

        $newDate = now()->addDays(5)->format('Y-m-d H:i:s');

        Sanctum::actingAs($this->receptionistUser);

        $response = $this->patchJson("/api/v1/appointments/{$appointment->id}/reschedule", [
            'scheduled_at' => $newDate,
            'notes' => 'Rescheduled due to provider availability.',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => Appointment::STATUS_RESCHEDULED,
            'notes' => 'Rescheduled due to provider availability.',
        ]);
    }
}
