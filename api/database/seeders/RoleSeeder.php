<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create an admin user (you can modify these details)
        User::updateOrCreate(
            ['email' => 'admin@hostelbooking.com'],
            [
                'name' => 'System Administrator',
                'admission_number' => 'ADMIN001',
                'level' => 'Admin',
                'phone_number' => '+1234567890',
                'password' => Hash::make('admin123'), // Change this password in production
                'role' => 'admin',
            ]
        
        );

        $this->command->info('Default admin and student users created successfully!');
        $this->command->info('Admin:  ADMIN001 / admin123');
        $this->command->info('Student: student@hostelbooking.com / student123');
    }
}
