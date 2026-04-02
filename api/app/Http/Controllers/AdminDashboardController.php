<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    /**
     * Get admin dashboard data
     */
    public function dashboard(Request $request): JsonResponse
    {
        // Admin can see all statistics
        $data = [
            'message' => 'Welcome to Admin Dashboard',
            'user' => $request->user(),
            'statistics' => [
                'total_users' => \App\Models\User::count(),
                'total_hostels' => \App\Models\Hostel::count(),
                'total_rooms' => \App\Models\Room::count(),
                'total_bookings' => \App\Models\HostelBooking::count(),
            ],
            'recent_bookings' => \App\Models\HostelBooking::with(['user', 'room', 'hostel'])
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get all users (admin only)
     */
    public function getUsers(Request $request): JsonResponse
    {
        $users = \App\Models\User::select('id', 'name', 'email', 'admission_number', 'role', 'level', 'phone_number', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Update user role (admin only)
     */
    public function updateUserRole(Request $request, $userId): JsonResponse
    {
        $request->validate([
            'role' => 'required|in:admin,student'
        ]);

        $user = \App\Models\User::findOrFail($userId);
        $user->role = $request->role;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'User role updated successfully',
            'data' => $user
        ]);
    }
}
