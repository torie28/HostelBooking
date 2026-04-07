<?php

// Test script to verify payment creation functionality
// This script can be used to test the payment creation from existing bookings

require __DIR__ . '/vendor/autoload.php';

use App\Models\HostelBooking;
use App\Models\PaymentHostel;
use App\Models\User;
use Illuminate\Support\Facades\DB;

// Test 1: Check if there are existing bookings without payments
echo "=== Test 1: Checking existing bookings without payments ===\n";
$bookingsWithoutPayments = HostelBooking::leftJoin('payment_hostels', 'hostel_bookings.id', '=', 'payment_hostels.booking_id')
    ->whereNull('payment_hostels.booking_id')
    ->get();

echo "Found {$bookingsWithoutPayments->count()} bookings without payments\n";

foreach ($bookingsWithoutPayments as $booking) {
    echo "Booking ID: {$booking->id}, Student: {$booking->student_name}, Amount: {$booking->amount}\n";
}

// Test 2: Create payment for first booking without payment (if any exists)
if ($bookingsWithoutPayments->count() > 0) {
    echo "\n=== Test 2: Creating payment for first booking ===\n";
    $booking = $bookingsWithoutPayments->first();
    
    $student = User::where('admission_number', $booking->admission_number)->first();
    
    if ($student) {
        try {
            $payment = PaymentHostel::create([
                'student_id' => $student->id,
                'academic_year' => $booking->academic_year,
                'booking_id' => $booking->id,
                'amount' => $booking->amount,
                'status' => 'paid',
                'due_date' => now()->addDays(30),
            ]);
            
            echo "Payment created successfully! Payment ID: {$payment->id}\n";
            echo "Student ID: {$payment->student_id}, Amount: {$payment->amount}, Status: {$payment->status}\n";
            
        } catch (\Exception $e) {
            echo "Error creating payment: " . $e->getMessage() . "\n";
        }
    } else {
        echo "Student not found for admission number: {$booking->admission_number}\n";
    }
}

// Test 3: Verify payment retrieval by admission number
echo "\n=== Test 3: Testing payment retrieval by admission number ===\n";
if (isset($booking)) {
    $student = User::where('admission_number', $booking->admission_number)->first();
    if ($student) {
        $payment = PaymentHostel::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->first();
            
        if ($payment) {
            echo "Payment found for student {$booking->admission_number}:\n";
            echo "Amount: {$payment->amount}, Status: {$payment->status}, Booking ID: {$payment->booking_id}\n";
        } else {
            echo "No payment found for student {$booking->admission_number}\n";
        }
    }
}

echo "\n=== Test completed ===\n";
