<?php

namespace App\Http\Controllers;

use App\Models\PaymentHostel;
use App\Models\User;
use App\Models\HostelBooking;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentHostelController extends Controller
{
    public function index()
    {
        $payments = PaymentHostel::with(['student', 'booking'])->get();
        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'student_id' => 'required|exists:users,id',
            'academic_year' => 'required|string',
            'booking_id' => 'nullable|exists:hostel_bookings,id',
            'status' => 'required|in:pending,paid,overdue',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $payment = PaymentHostel::create([
                'student_id' => $request->student_id,
                'academic_year' => $request->academic_year,
                'booking_id' => $request->booking_id,
                'status' => $request->status,
                'amount' => $request->amount,
                'due_date' => $request->due_date,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment created successfully',
                'payment' => $payment->load(['student', 'booking'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment creation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $payment = PaymentHostel::with(['student', 'booking', 'transactions'])->find($id);
        
        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        return response()->json($payment);
    }

    public function update(Request $request, $id)
    {
        $payment = PaymentHostel::find($id);
        
        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:pending,paid,overdue',
            'amount' => 'sometimes|numeric|min:0',
            'due_date' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $payment->update($request->only(['status', 'amount', 'due_date']));

            return response()->json([
                'success' => true,
                'message' => 'Payment updated successfully',
                'payment' => $payment->load(['student', 'booking', 'transactions'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment update failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $payment = PaymentHostel::find($id);
        
        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        try {
            $payment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Payment deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment deletion failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getStudentPayments($studentId)
    {
        $student = User::find($studentId);
        
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        $payments = PaymentHostel::where('student_id', $studentId)
            ->with(['booking'])
            ->orderBy('due_date', 'desc')
            ->get();

        return response()->json($payments);
    }

    public function getPendingPayments()
    {
        $pendingPayments = PaymentHostel::where('status', 'pending')
            ->orWhere('status', 'overdue')
            ->with(['student'])
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json($pendingPayments);
    }

    public function createPaymentFromBooking(Request $request, $bookingId)
    {
        $booking = HostelBooking::find($bookingId);
        
        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking not found'
            ], 404);
        }

        // Check if payment already exists for this booking
        $existingPayment = PaymentHostel::where('booking_id', $bookingId)->first();
        if ($existingPayment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment already exists for this booking'
            ], 400);
        }

        try {
            // Find student by admission number
            $student = User::where('admission_number', $booking->admission_number)->first();
            
            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found for this booking'
                ], 404);
            }

            $payment = PaymentHostel::create([
                'student_id' => $student->id,
                'academic_year' => $booking->academic_year,
                'booking_id' => $booking->id,
                'amount' => $booking->amount,
                'status' => 'paid', // Mark as paid since booking was successful
                'due_date' => now()->addDays(30), // Set due date 30 days from now
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment created successfully from booking',
                'payment' => $payment->load(['student', 'booking'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment creation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getStudentPaymentAmount($admissionNumber)
    {
        $student = User::where('admission_number', $admissionNumber)->first();
        
        if (!$student) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        }

        // Get the latest payment for the student (including pending payments)
        $payment = PaymentHostel::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'No payment found for student'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'amount' => $payment->amount,
            'status' => $payment->status,
            'payment' => $payment->load(['booking'])
        ]);
    }
}
