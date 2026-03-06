<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'admission_number' => 'ADM0001',
            'level' => '100',
            'phone_number' => '+1234567890',
        ]);

        $this->call([
            HostelSeeder::class,
            RoomSeeder::class,
            BedSeeder::class,
        ]);
    }
}
