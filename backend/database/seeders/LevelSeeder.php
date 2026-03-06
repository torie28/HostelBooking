<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LevelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $levels = [
            'Level 1',
            'Level 2',
            'Level 3',
            'Level 4',
            'Level 5',
            'Level 6',
            'Level 7-1',
            'Level 7-2',
            'Level 8'
        ];

        foreach ($levels as $level) {
            \DB::table('levels')->insert([
                'name' => $level,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
