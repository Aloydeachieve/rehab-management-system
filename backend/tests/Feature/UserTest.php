<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $receptionistUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Admin']);
        $receptionistRole = Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Receptionist']);

        $this->adminUser = User::factory()->create(['status' => 'active']);
        $this->adminUser->roles()->attach($adminRole);

        $this->receptionistUser = User::factory()->create(['status' => 'active']);
        $this->receptionistUser->roles()->attach($receptionistRole);
    }

    /**
     * Test admin can list staff.
     */
    public function test_admin_can_list_staff(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(200)
            ->assertJsonStructure(['users']);
    }

    /**
     * Test receptionist cannot list staff.
     */
    public function test_receptionist_cannot_list_staff(): void
    {
        Sanctum::actingAs($this->receptionistUser);

        $response = $this->getJson('/api/v1/users');

        $response->assertStatus(403);
    }

    /**
     * Test admin can create staff user.
     */
    public function test_admin_can_create_staff_user(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'name' => 'Dr. Andrew Okafor',
            'email' => 'andrew@rehabcenter.local',
            'phone' => '+2348039999999',
            'password' => 'password123',
            'role' => 'doctor',
            'profession' => 'Psychiatrist',
            'license_number' => 'MD-12345-NGR',
        ];

        $response = $this->postJson('/api/v1/users', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Staff account created successfully.');

        $this->assertDatabaseHas('users', [
            'email' => 'andrew@rehabcenter.local',
            'name' => 'Dr. Andrew Okafor',
        ]);

        $this->assertDatabaseHas('staff_profiles', [
            'profession' => 'Psychiatrist',
            'license_number' => 'MD-12345-NGR',
        ]);
    }

    /**
     * Test admin can update staff user.
     */
    public function test_admin_can_update_staff_user(): void
    {
        $targetUser = User::factory()->create(['status' => 'active']);
        $targetUser->roles()->attach(Role::where('name', 'receptionist')->first()->id);
        $targetUser->staffProfile()->create([
            'profession' => 'Receptionist Clerk',
            'status' => 'active',
        ]);

        Sanctum::actingAs($this->adminUser);

        $payload = [
            'name' => 'Andrew Changed Name',
            'email' => $targetUser->email,
            'phone' => '+2348000000000',
            'role' => 'receptionist',
            'status' => 'inactive',
            'profession' => 'Senior Receptionist',
        ];

        $response = $this->patchJson("/api/v1/users/{$targetUser->id}", $payload);

        $response->assertStatus(200);

        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'name' => 'Andrew Changed Name',
            'status' => 'inactive',
        ]);

        $this->assertDatabaseHas('staff_profiles', [
            'user_id' => $targetUser->id,
            'profession' => 'Senior Receptionist',
            'status' => 'inactive',
        ]);
    }
}
