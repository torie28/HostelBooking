<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoomSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Boys Hostel A (ID: 1) - 4 floors, rooms with 2-4 beds each
        $boysHostelARooms = [
            // Floor 1
            ['hostel_id' => 1, 'floor_number' => 1, 'room_number' => '101', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 1, 'room_number' => '102', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 1, 'room_number' => '103', 'total_beds' => 3, 'status' => 'full'],
            ['hostel_id' => 1, 'floor_number' => 1, 'room_number' => '104', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 1, 'room_number' => '105', 'total_beds' => 2, 'status' => 'maintenance'],
            
            // Floor 2
            ['hostel_id' => 1, 'floor_number' => 2, 'room_number' => '201', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 2, 'room_number' => '202', 'total_beds' => 3, 'status' => 'full'],
            ['hostel_id' => 1, 'floor_number' => 2, 'room_number' => '203', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 2, 'room_number' => '204', 'total_beds' => 2, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 2, 'room_number' => '205', 'total_beds' => 4, 'status' => 'available'],
            
            // Floor 3
            ['hostel_id' => 1, 'floor_number' => 3, 'room_number' => '301', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 3, 'room_number' => '302', 'total_beds' => 4, 'status' => 'full'],
            ['hostel_id' => 1, 'floor_number' => 3, 'room_number' => '303', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 3, 'room_number' => '304', 'total_beds' => 2, 'status' => 'available'],
            
            // Floor 4
            ['hostel_id' => 1, 'floor_number' => 4, 'room_number' => '401', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 4, 'room_number' => '402', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 1, 'floor_number' => 4, 'room_number' => '403', 'total_beds' => 4, 'status' => 'maintenance'],
            ['hostel_id' => 1, 'floor_number' => 4, 'room_number' => '404', 'total_beds' => 2, 'status' => 'available'],
        ];

        // Boys Hostel B (ID: 2) - 3 floors, rooms with 2-3 beds each
        $boysHostelBRooms = [
            // Floor 1
            ['hostel_id' => 2, 'floor_number' => 1, 'room_number' => '101', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 2, 'floor_number' => 1, 'room_number' => '102', 'total_beds' => 3, 'status' => 'full'],
            ['hostel_id' => 2, 'floor_number' => 1, 'room_number' => '103', 'total_beds' => 2, 'status' => 'available'],
            ['hostel_id' => 2, 'floor_number' => 1, 'room_number' => '104', 'total_beds' => 3, 'status' => 'available'],
            
            // Floor 2
            ['hostel_id' => 2, 'floor_number' => 2, 'room_number' => '201', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 2, 'floor_number' => 2, 'room_number' => '202', 'total_beds' => 2, 'status' => 'full'],
            ['hostel_id' => 2, 'floor_number' => 2, 'room_number' => '203', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 2, 'floor_number' => 2, 'room_number' => '204', 'total_beds' => 2, 'status' => 'maintenance'],
            
            // Floor 3
            ['hostel_id' => 2, 'floor_number' => 3, 'room_number' => '301', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 2, 'floor_number' => 3, 'room_number' => '302', 'total_beds' => 2, 'status' => 'available'],
            ['hostel_id' => 2, 'floor_number' => 3, 'room_number' => '303', 'total_beds' => 3, 'status' => 'full'],
            ['hostel_id' => 2, 'floor_number' => 3, 'room_number' => '304', 'total_beds' => 2, 'status' => 'available'],
        ];

        // Girls Hostel A (ID: 3) - 4 floors, rooms with 2-4 beds each
        $girlsHostelARooms = [
            // Floor 1
            ['hostel_id' => 3, 'floor_number' => 1, 'room_number' => '101', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 1, 'room_number' => '102', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 1, 'room_number' => '103', 'total_beds' => 4, 'status' => 'full'],
            ['hostel_id' => 3, 'floor_number' => 1, 'room_number' => '104', 'total_beds' => 2, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 1, 'room_number' => '105', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 1, 'room_number' => '106', 'total_beds' => 3, 'status' => 'available'],
            
            // Floor 2
            ['hostel_id' => 3, 'floor_number' => 2, 'room_number' => '201', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 2, 'room_number' => '202', 'total_beds' => 3, 'status' => 'full'],
            ['hostel_id' => 3, 'floor_number' => 2, 'room_number' => '203', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 2, 'room_number' => '204', 'total_beds' => 2, 'status' => 'maintenance'],
            ['hostel_id' => 3, 'floor_number' => 2, 'room_number' => '205', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 2, 'room_number' => '206', 'total_beds' => 3, 'status' => 'available'],
            
            // Floor 3
            ['hostel_id' => 3, 'floor_number' => 3, 'room_number' => '301', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 3, 'room_number' => '302', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 3, 'room_number' => '303', 'total_beds' => 4, 'status' => 'full'],
            ['hostel_id' => 3, 'floor_number' => 3, 'room_number' => '304', 'total_beds' => 2, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 3, 'room_number' => '305', 'total_beds' => 4, 'status' => 'available'],
            
            // Floor 4
            ['hostel_id' => 3, 'floor_number' => 4, 'room_number' => '401', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 4, 'room_number' => '402', 'total_beds' => 4, 'status' => 'available'],
            ['hostel_id' => 3, 'floor_number' => 4, 'room_number' => '403', 'total_beds' => 2, 'status' => 'full'],
            ['hostel_id' => 3, 'floor_number' => 4, 'room_number' => '404', 'total_beds' => 4, 'status' => 'maintenance'],
        ];

        // Girls Hostel B (ID: 4) - 3 floors, rooms with 2-3 beds each
        $girlsHostelBRooms = [
            // Floor 1
            ['hostel_id' => 4, 'floor_number' => 1, 'room_number' => '101', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 4, 'floor_number' => 1, 'room_number' => '102', 'total_beds' => 2, 'status' => 'available'],
            ['hostel_id' => 4, 'floor_number' => 1, 'room_number' => '103', 'total_beds' => 3, 'status' => 'full'],
            ['hostel_id' => 4, 'floor_number' => 1, 'room_number' => '104', 'total_beds' => 2, 'status' => 'available'],
            ['hostel_id' => 4, 'floor_number' => 1, 'room_number' => '105', 'total_beds' => 3, 'status' => 'available'],
            
            // Floor 2
            ['hostel_id' => 4, 'floor_number' => 2, 'room_number' => '201', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 4, 'floor_number' => 2, 'room_number' => '202', 'total_beds' => 2, 'status' => 'full'],
            ['hostel_id' => 4, 'floor_number' => 2, 'room_number' => '203', 'total_beds' => 3, 'status' => 'maintenance'],
            ['hostel_id' => 4, 'floor_number' => 2, 'room_number' => '204', 'total_beds' => 2, 'status' => 'available'],
            ['hostel_id' => 4, 'floor_number' => 2, 'room_number' => '205', 'total_beds' => 3, 'status' => 'available'],
            
            // Floor 3
            ['hostel_id' => 4, 'floor_number' => 3, 'room_number' => '301', 'total_beds' => 2, 'status' => 'available'],
            ['hostel_id' => 4, 'floor_number' => 3, 'room_number' => '302', 'total_beds' => 3, 'status' => 'available'],
            ['hostel_id' => 4, 'floor_number' => 3, 'room_number' => '303', 'total_beds' => 2, 'status' => 'full'],
            ['hostel_id' => 4, 'floor_number' => 3, 'room_number' => '304', 'total_beds' => 3, 'status' => 'available'],
        ];

        // Combine all room data and add timestamps
        $allRooms = array_merge($boysHostelARooms, $boysHostelBRooms, $girlsHostelARooms, $girlsHostelBRooms);
        
        foreach ($allRooms as &$room) {
            $room['created_at'] = now();
            $room['updated_at'] = now();
        }

        DB::table('rooms')->insert($allRooms);
    }
}
