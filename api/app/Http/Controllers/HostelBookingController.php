<?php

namespace App\Http\Controllers;

use App\Models\HostelBooking;
use App\Models\User;
use App\Models\Bed;
use App\Models\PaymentHostel;
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

    public function storeFromFrontend(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:users,id',
            'bed_id' => 'required|exists:beds,id',
            'status' => 'required|in:active,completed,cancelled',
            'amount' => 'required|numeric|min:0',
            'controlnumber' => 'required|string|unique:hostel_bookings,controlnumber',
            'booking_date' => 'required|date',
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
                'status' => $request->status,
                'amount' => $request->amount,
                'controlnumber' => $request->controlnumber,
                'booking_date' => $request->booking_date,
            ]);

            // Create payment record automatically when booking is successful
            try {
                $student = User::find($request->student_id);
                
                if ($student) {
                    PaymentHostel::create([
                        'student_id' => $student->id,
                        'academic_year' => $student->academic_year,
                        'booking_id' => $booking->id,
                        'amount' => $request->amount,
                        'status' => 'paid', // Mark as paid since booking was successful
                        'due_date' => now()->addDays(30), // Set due date 30 days from now
                    ]);
                }
            } catch (\Exception $e) {
                // Log payment creation error but don't fail the booking
                \Log::error('Failed to create payment record for booking', [
                    'booking_id' => $booking->id,
                    'error' => $e->getMessage()
                ]);
            }

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
                'id' => $booking->id,
                'success' => true,
                'message' => 'Booking created successfully',
                'booking' => $booking->load(['bed.room.hostel'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Booking failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getByControlNumber($controlNumber)
    {
        $booking = HostelBooking::with(['bed.room.hostel'])
            ->where('controlnumber', $controlNumber)
            ->first();
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        }

        return response()->json($booking);
    }

    public function getByStudent($studentId)
    {
        $bookings = HostelBooking::with(['bed.room.hostel', 'student'])
            ->where('student_id', $studentId)
            ->get();

        return response()->json($bookings);
    }

    public function updateStatus(Request $request, $id)
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
                'message' => 'Booking status updated successfully',
                'booking' => $booking->load(['bed.room.hostel'])
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
