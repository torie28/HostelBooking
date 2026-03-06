<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all rooms from the database
        $rooms = DB::table('rooms')->get();
        
        $beds = [];
        
        foreach ($rooms as $room) {
            // Create beds for each room based on total_beds
            for ($bedNumber = 1; $bedNumber <= $room->total_beds; $bedNumber++) {
                $beds[] = [
                    'room_id' => $room->id,
                    'bed_number' => $bedNumber,
                    'status' => $room->status === 'available' ? 'available' : 'occupied',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        // Insert all beds in batches
        if (!empty($beds)) {
            DB::table('beds')->insert($beds);
        }
    }
}
