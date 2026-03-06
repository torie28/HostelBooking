<?php

namespace App\Http\Controllers;

use App\Models\HostelBooking;
use App\Models\User;
use App\Models\Bed;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class HostelBookingController extends Controller
{
    public function index()
    {
        $bookings = HostelBooking::with(['student', 'bed.room.hostel'])->get();
        return response()->json($bookings);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:users,id',
            'bed_id' => 'required|exists:beds,id',
            'academic_year' => 'required|string',
            'admission_number' => 'required|string|exists:users,admission_number',
            'status' => 'required|in:active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check if bed is already occupied
            $existingBooking = HostelBooking::where('bed_id', $request->bed_id)
                ->where('status', 'active')
                ->first();

            if ($existingBooking) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bed is already occupied'
                ], 400);
            }

            $booking = HostelBooking::create([
                'student_id' => $request->student_id,
                'bed_id' => $request->bed_id,
                'academic_year' => $request->academic_year,
                'status' => $request->status,
                'booking_date' => now(),
            ]);

            // Update bed status to occupied
            $bed = Bed::find($request->bed_id);
            $bed->status = 'occupied';
            $bed->save();

            // Check if room is now full and update room status
            $room = $bed->room;
            $totalBeds = $room->total_beds;
            $occupiedBeds = Bed::where('room_id', $room->id)
                ->where('status', 'occupied')
                ->count();

            if ($occupiedBeds >= $totalBeds) {
                $room->status = 'full';
                $room->save();
            } else if ($room->status === 'full' && $occupiedBeds < $totalBeds) {
                // If room was marked as full but now has available beds
                $room->status = 'available';
                $room->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Booking created successfully',
                'booking' => $booking->load(['student', 'bed.room.hostel'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Booking failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $booking = HostelBooking::with(['student', 'bed.room.hostel'])->find($id);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        }

        return response()->json($booking);
    }

    public function update(Request $request, $id)
    {
        $booking = HostelBooking::find($id);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:active,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $oldStatus = $booking->status;
            $booking->update($request->only(['status']));

            // Update bed status based on booking status
            if ($oldStatus !== $request->status) {
                $bed = Bed::find($booking->bed_id);
                if ($request->status === 'cancelled' || $request->status === 'completed') {
                    $bed->status = 'available';
                } else if ($request->status === 'active') {
                    $bed->status = 'occupied';
                }
                $bed->save();

                // Check and update room status based on current bed occupancy
                $room = $bed->room;
                $totalBeds = $room->total_beds;
                $occupiedBeds = Bed::where('room_id', $room->id)
                    ->where('status', 'occupied')
                    ->count();

                if ($occupiedBeds >= $totalBeds) {
                    $room->status = 'full';
                    $room->save();
                } else {
                    $room->status = 'available';
                    $room->save();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Booking updated successfully',
                'booking' => $booking->load(['student', 'bed.room.hostel'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Update failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $booking = HostelBooking::find($id);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        }

        try {
            // Update bed status to available
            $bed = Bed::find($booking->bed_id);
            $bed->status = 'available';
            $bed->save();

            // Check and update room status based on current bed occupancy
            $room = $bed->room;
            $totalBeds = $room->total_beds;
            $occupiedBeds = Bed::where('room_id', $room->id)
                ->where('status', 'occupied')
                ->count();

            if ($occupiedBeds >= $totalBeds) {
                $room->status = 'full';
                $room->save();
            } else {
                $room->status = 'available';
                $room->save();
            }

            $booking->delete();

            return response()->json([
                'success' => true,
                'message' => 'Booking deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Delete failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
