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

// Hostel Booking routes
Route::apiResource('hostel-bookings', HostelBookingController::class);

// Payment Hostel routes
Route::apiResource('payment-hostels', PaymentHostelController::class);
Route::get('/payment-hostels/student/{studentId}', [PaymentHostelController::class, 'getStudentPayments']);
Route::get('/payment-hostels/pending', [PaymentHostelController::class, 'getPendingPayments']);

// Transaction Hostel routes
Route::apiResource('transaction-hostels', TransactionHostelController::class);
Route::get('/transaction-hostels/payment/{paymentId}', [TransactionHostelController::class, 'getTransactionsByPayment']);
Route::get('/transaction-hostels/completed', [TransactionHostelController::class, 'getCompletedTransactions']);
