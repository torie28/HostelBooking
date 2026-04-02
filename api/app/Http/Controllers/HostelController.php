<?php

namespace App\Http\Controllers;

use App\Models\Hostel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HostelController extends Controller
{
    public function index()
    {
        $hostels = Hostel::with('rooms.beds')->get()->map(function ($hostel) {
            return [
                'id' => $hostel->id,
                'name' => $hostel->name,
                'gender' => $hostel->gender,
                'capacity' => $hostel->capacity,
                'status' => $hostel->status,
                'available_rooms' => $hostel->rooms->where('status', 'available')->count(),
                'rooms' => $hostel->rooms->map(function ($room) {
                    $availableBeds = $room->beds->where('status', 'available')->count();
                    return [
                        'id' => $room->id,
                        'hostel_id' => $room->hostel_id,
                        'floor_number' => $room->floor_number,
                        'room_number' => $room->room_number,
                        'total_beds' => $room->total_beds,
                        'status' => $room->status,
                        'available_beds' => $availableBeds,
                        'beds' => $room->beds->map(function ($bed) {
                            return [
                                'id' => $bed->id,
                                'bed_number' => $bed->bed_number,
                                'status' => $bed->status
                            ];
                        })->toArray(),
                        'created_at' => $room->created_at,
                        'updated_at' => $room->updated_at
                    ];
                })->toArray()
            ];
        });
        return response()->json($hostels);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:hostels',
            'gender' => 'required|in:male,female,mixed',
            'capacity' => 'required|integer|min:1',
            'status' => 'required|in:active,inactive,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $hostel = Hostel::create([
                'name' => $request->name,
                'gender' => $request->gender,
                'capacity' => $request->capacity,
                'status' => $request->status,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Hostel created successfully',
                'hostel' => $hostel->load('rooms')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Hostel creation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $hostelData = Hostel::with('rooms.beds')->find($id);
        
        if (!$hostelData) {
            return response()->json([
                'success' => false,
                'message' => 'Hostel not found'
            ], 404);
        }

        $hostel = [
            'id' => $hostelData->id,
            'name' => $hostelData->name,
            'gender' => $hostelData->gender,
            'capacity' => $hostelData->capacity,
            'status' => $hostelData->status,
            'available_rooms' => $hostelData->rooms->where('status', 'available')->count(),
            'rooms' => $hostelData->rooms->map(function ($room) {
                $availableBeds = $room->beds->where('status', 'available')->count();
                return [
                    'id' => $room->id,
                    'hostel_id' => $room->hostel_id,
                    'floor_number' => $room->floor_number,
                    'room_number' => $room->room_number,
                    'total_beds' => $room->total_beds,
                    'status' => $room->status,
                    'available_beds' => $availableBeds,
                    'beds' => $room->beds->map(function ($bed) {
                        return [
                            'id' => $bed->id,
                            'bed_number' => $bed->bed_number,
                            'status' => $bed->status
                        ];
                    })->toArray(),
                    'created_at' => $room->created_at,
                    'updated_at' => $room->updated_at
                ];
            })->toArray()
        ];

        return response()->json($hostel);
    }

    public function update(Request $request, $id)
    {
        $hostel = Hostel::find($id);
        
        if (!$hostel) {
            return response()->json([
                'success' => false,
                'message' => 'Hostel not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255|unique:hostels,name,' . $id,
            'gender' => 'sometimes|in:male,female,mixed',
            'capacity' => 'sometimes|integer|min:1',
            'status' => 'sometimes|in:active,inactive,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $hostel->update($request->only(['name', 'gender', 'capacity', 'status']));

            return response()->json([
                'success' => true,
                'message' => 'Hostel updated successfully',
                'hostel' => $hostel->load('rooms')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Hostel update failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $hostel = Hostel::find($id);
        
        if (!$hostel) {
            return response()->json([
                'success' => false,
                'message' => 'Hostel not found'
            ], 404);
        }

        try {
            $hostel->delete();

            return response()->json([
                'success' => true,
                'message' => 'Hostel deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Hostel deletion failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getAvailableBeds($id)
    {
        $hostel = Hostel::find($id);
        
        if (!$hostel) {
            return response()->json([
                'success' => false,
                'message' => 'Hostel not found'
            ], 404);
        }

        $availableBeds = $hostel->rooms()
            ->with('beds')
            ->get()
            ->flatMap(function ($room) {
                return $room->beds->where('status', 'available');
            });

        return response()->json($availableBeds);
    }
}
