<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class GenderController extends Controller
{
    /**
     * Get available gender options
     */
    public function index()
    {
        $genders = [
            ['value' => 'male', 'label' => 'Male'],
            ['value' => 'female', 'label' => 'Female'],
            ['value' => 'other', 'label' => 'Other'],
        ];

        return response()->json($genders);
    }
}
