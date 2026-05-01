<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LevelController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\HostelBookingController;
use App\Http\Controllers\HostelController;
use App\Http\Controllers\PaymentHostelController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\TransactionHostelController;
use App\Http\Controllers\GenderController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\StudentDashboardController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Authentication routes
Route::post('/register', [RegistrationController::class, 'register']);
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->middleware('auth:sanctum');

// Levels routes
Route::apiResource('levels', LevelController::class);

// Gender routes
Route::get('/genders', [GenderController::class, 'index']);

// Hostel routes
Route::apiResource('hostels', HostelController::class);
Route::get('/hostels/{id}/available-beds', [HostelController::class, 'getAvailableBeds']);

// Room routes
Route::apiResource('rooms', RoomController::class);
Route::get('/rooms/by-hostel/{hostelId}', [RoomController::class, 'getRoomsByHostel']);
Route::get('/rooms/available/{hostelId}', [RoomController::class, 'getAvailableRooms']);
Route::put('/beds/{id}', [RoomController::class, 'updateBed']);
Route::delete('/beds/{id}', [RoomController::class, 'deleteBed']);
Route::get('/beds', [RoomController::class, 'getBeds']);

// Hostel Booking routes
Route::apiResource('hostel-bookings', HostelBookingController::class);

// Bookings routes (for frontend compatibility)
Route::post('/bookings', [HostelBookingController::class, 'storeFromFrontend']);
Route::get('/bookings', [HostelBookingController::class, 'index']);
Route::get('/bookings/control-number/{controlNumber}', [HostelBookingController::class, 'getByControlNumber']);
Route::get('/bookings/student/{studentId}', [HostelBookingController::class, 'getByStudent']);
Route::get('/users/{id}', [HostelBookingController::class, 'getUserById']);
Route::put('/bookings/{id}/status', [HostelBookingController::class, 'updateStatus']);

// Payment Hostel routes
Route::apiResource('payment-hostels', PaymentHostelController::class);
Route::get('/payment-hostels/student/{studentId}', [PaymentHostelController::class, 'getStudentPayments']);
Route::get('/payment-hostels/pending', [PaymentHostelController::class, 'getPendingPayments']);
Route::get('/payment-hostels/student-amount/{admissionNumber}', [PaymentHostelController::class, 'getStudentPaymentAmount']);
Route::post('/payment-hostels/from-booking/{bookingId}', [PaymentHostelController::class, 'createPaymentFromBooking']);

// Transaction Hostel routes
Route::apiResource('transaction-hostels', TransactionHostelController::class);
Route::get('/transaction-hostels/payment/{paymentId}', [TransactionHostelController::class, 'getTransactionsByPayment']);
Route::get('/transaction-hostels/completed', [TransactionHostelController::class, 'getCompletedTransactions']);

// Dashboard routes with role-based access
Route::middleware('auth:sanctum')->group(function () {
    // Admin dashboard routes
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'dashboard']);
        Route::get('/users', [AdminDashboardController::class, 'getUsers']);
        Route::put('/users/{userId}/role', [AdminDashboardController::class, 'updateUserRole']);
    });

    // Student dashboard routes
    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/dashboard', [StudentDashboardController::class, 'dashboard']);
        Route::get('/my-bookings', [StudentDashboardController::class, 'getMyBookings']);
        Route::post('/book-room', [StudentDashboardController::class, 'bookRoom']);
    });
});
