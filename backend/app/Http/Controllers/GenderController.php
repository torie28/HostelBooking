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
        ];

        return response()->json($genders);
    }
}
