<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StudentDashboardController extends Controller
{
    /**
     * Get student dashboard data
     */
    public function dashboard(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Student specific data
        $data = [
            'message' => 'Welcome to Student Dashboard',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'admission_number' => $user->admission_number,
                'level' => $user->level,
                'phone_number' => $user->phone_number,
                'role' => $user->role,
            ],
            'my_bookings' => \App\Models\HostelBooking::with(['room', 'hostel'])
                ->where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get(),
            'available_hostels' => \App\Models\Hostel::with(['rooms' => function($query) {
                    $query->where('is_available', true);
                }])
                ->where('is_active', true)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get student's booking history
     */
    public function getMyBookings(Request $request): JsonResponse
    {
        $bookings = \App\Models\HostelBooking::with(['room', 'hostel'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $bookings
        ]);
    }

    /**
     * Book a room (student only)
     */
    public function bookRoom(Request $request): JsonResponse
    {
        $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'hostel_id' => 'required|exists:hostels,id',
        ]);

        // Check if room is available
        $room = \App\Models\Room::findOrFail($request->room_id);
        if (!$room->is_available) {
            return response()->json([
                'success' => false,
                'message' => 'Room is not available'
            ], 400);
        }

        // Check if student already has an active booking
        $existingBooking = \App\Models\HostelBooking::where('user_id', $request->user()->id)
            ->where('status', 'active')
            ->first();

        if ($existingBooking) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active booking'
            ], 400);
        }

        // Create booking
        $booking = \App\Models\HostelBooking::create([
            'user_id' => $request->user()->id,
            'room_id' => $request->room_id,
            'hostel_id' => $request->hostel_id,
            'status' => 'pending',
            'booking_date' => now(),
        ]);

        // Update room availability
        $room->is_available = false;
        $room->save();

        return response()->json([
            'success' => true,
            'message' => 'Room booked successfully',
            'data' => $booking->load(['room', 'hostel'])
        ]);
    }
}
