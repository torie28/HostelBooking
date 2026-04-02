<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\Hostel;
use App\Models\Bed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoomController extends Controller
{
    public function index()
    {
        $rooms = Room::with(['hostel', 'beds.activeBooking.student'])->get();
        
        // Transform rooms to include calculated fields and properly structure bed data
        $rooms->transform(function ($room) {
            $room->available_beds = $room->availableBeds()->count();
            $room->occupied_beds = $room->occupiedBeds()->count();
            
            // Transform beds to include active_booking field
            $room->beds->transform(function ($bed) {
                $bed->active_booking = $bed->activeBooking;
                return $bed;
            });
            
            // Auto-update room status based on bed occupancy
            if ($room->occupied_beds >= $room->total_beds) {
                $room->status = 'full';
            } else if ($room->occupied_beds > 0) {
                $room->status = 'available';
            }
            
            return $room;
        });
        
        return response()->json($rooms);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'hostel_id' => 'required|exists:hostels,id',
            'floor_number' => 'required|integer|min:1',
            'room_number' => 'required|string|max:50',
            'total_beds' => 'required|integer|min:1',
            'status' => 'required|in:available,full,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $room = Room::create([
                'hostel_id' => $request->hostel_id,
                'floor_number' => $request->floor_number,
                'room_number' => $request->room_number,
                'total_beds' => $request->total_beds,
                'status' => $request->status,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Room created successfully',
                'room' => $room->load(['hostel', 'beds'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Room creation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $room = Room::with(['hostel', 'beds'])->find($id);
        
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found'
            ], 404);
        }

        return response()->json($room);
    }

    public function update(Request $request, $id)
    {
        $room = Room::find($id);
        
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'hostel_id' => 'sometimes|exists:hostels,id',
            'floor_number' => 'sometimes|integer|min:1',
            'room_number' => 'sometimes|string|max:50',
            'total_beds' => 'sometimes|integer|min:1',
            'status' => 'sometimes|in:available,full,maintenance',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $room->update($request->only(['hostel_id', 'floor_number', 'room_number', 'total_beds', 'status']));

            return response()->json([
                'success' => true,
                'message' => 'Room updated successfully',
                'room' => $room->load(['hostel', 'beds'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Room update failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $room = Room::find($id);
        
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found'
            ], 404);
        }

        try {
            $room->delete();

            return response()->json([
                'success' => true,
                'message' => 'Room deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Room deletion failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getRoomsByHostel($hostelId)
    {
        $hostel = Hostel::find($hostelId);
        
        if (!$hostel) {
            return response()->json([
                'success' => false,
                'message' => 'Hostel not found'
            ], 404);
        }

        $rooms = Room::where('hostel_id', $hostelId)
            ->with(['beds.activeBooking.student'])
            ->orderBy('floor_number')
            ->orderBy('room_number')
            ->get();

        // Transform rooms to include calculated fields and properly structure bed data
        $rooms->transform(function ($room) {
            $room->available_beds = $room->availableBeds()->count();
            $room->occupied_beds = $room->occupiedBeds()->count();
            
            // Transform beds to include active_booking field
            $room->beds->transform(function ($bed) {
                $bed->active_booking = $bed->activeBooking;
                return $bed;
            });
            
            // Auto-update room status based on bed occupancy
            if ($room->occupied_beds >= $room->total_beds) {
                $room->status = 'full';
            } else if ($room->occupied_beds > 0) {
                $room->status = 'available';
            }
            
            return $room;
        });

        return response()->json($rooms);
    }

    public function getAvailableRooms($hostelId)
    {
        $hostel = Hostel::find($hostelId);
        
        if (!$hostel) {
            return response()->json([
                'success' => false,
                'message' => 'Hostel not found'
            ], 404);
        }

        $availableRooms = Room::where('hostel_id', $hostelId)
            ->where('status', 'available')
            ->with(['beds' => function ($query) {
                $query->where('status', 'available');
            }])
            ->orderBy('floor_number')
            ->orderBy('room_number')
            ->get();

        return response()->json($availableRooms);
    }

    public function updateBed(Request $request, $id)
    {
        $bed = Bed::find($id);
        
        if (!$bed) {
            return response()->json([
                'success' => false,
                'message' => 'Bed not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'bed_number' => 'sometimes|string|max:50',
            'room_id' => 'sometimes|exists:rooms,id',
            'status' => 'sometimes|in:available,occupied',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $bed->update($request->only(['bed_number', 'room_id', 'status']));

            return response()->json([
                'success' => true,
                'message' => 'Bed updated successfully',
                'bed' => $bed->load('room')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bed update failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteBed($id)
    {
        $bed = Bed::find($id);
        
        if (!$bed) {
            return response()->json([
                'success' => false,
                'message' => 'Bed not found'
            ], 404);
        }

        try {
            $bed->delete();

            return response()->json([
                'success' => true,
                'message' => 'Bed deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bed deletion failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getBeds(Request $request)
    {
        $roomId = $request->query('room_id');
        
        if (!$roomId) {
            return response()->json([
                'success' => false,
                'message' => 'Room ID is required'
            ], 400);
        }

        $room = Room::find($roomId);
        
        if (!$room) {
            return response()->json([
                'success' => false,
                'message' => 'Room not found'
            ], 404);
        }

        $beds = Bed::where('room_id', $roomId)
            ->with(['activeBooking.student'])
            ->get();

        // Transform beds to include active_booking field
        $beds->transform(function ($bed) {
            $bed->active_booking = $bed->activeBooking;
            return $bed;
        });

        return response()->json($beds);
    }
}
