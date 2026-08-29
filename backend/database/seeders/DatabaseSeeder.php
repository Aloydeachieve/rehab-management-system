<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::firstOrCreate(['name' => Role::ADMIN], ['description' => 'Full system access']);
        Role::firstOrCreate(['name' => Role::DOCTOR], ['description' => 'Clinical work and assigned patients']);
        Role::firstOrCreate(['name' => Role::RECEPTIONIST], ['description' => 'Front-desk and operational work']);

        $adminUser = User::firstOrCreate(
            ['email' => 'admin@rehabcenter.local'],
            [
                'name' => 'System Administrator',
                'password' => Hash::make('password'),
                'status' => 'active',
            ]
        );

        $adminUser->roles()->syncWithoutDetaching([$admin->id]);
    }
}
