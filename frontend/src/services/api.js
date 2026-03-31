const API_BASE_URL = 'http://localhost:8000/api';

// Get authentication token from localStorage
const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: getAuthHeaders(),
        ...options,
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// Hostel API functions
export const hostelApi = {
    // Get all hostels
    getAll: () => apiRequest('/hostels'),

    // Get hostel by ID
    getById: (id) => apiRequest(`/hostels/${id}`),

    // Get available beds for a hostel
    getAvailableBeds: (id) => apiRequest(`/hostels/${id}/available-beds`),

    // Create new hostel
    create: (hostelData) => apiRequest('/hostels', {
        method: 'POST',
        body: JSON.stringify(hostelData)
    }),

    // Update hostel
    update: (id, hostelData) => apiRequest(`/hostels/${id}`, {
        method: 'PUT',
        body: JSON.stringify(hostelData)
    }),

    // Delete hostel
    delete: (id) => apiRequest(`/hostels/${id}`, {
        method: 'DELETE'
    }),
};

// Room API functions
export const roomApi = {
    // Get rooms by hostel
    getByHostel: (hostelId) => apiRequest(`/rooms/by-hostel/${hostelId}`),

    // Get available rooms for a hostel
    getAvailable: (hostelId) => apiRequest(`/rooms/available/${hostelId}`),

    // Get all rooms
    getAll: () => apiRequest('/rooms'),

    // Get beds for a specific room
    getRoomBeds: (roomId) => apiRequest(`/beds?room_id=${roomId}`),

    // Create new room
    create: (roomData) => apiRequest('/rooms', {
        method: 'POST',
        body: JSON.stringify(roomData)
    }),

    // Update room
    update: (id, roomData) => apiRequest(`/rooms/${id}`, {
        method: 'PUT',
        body: JSON.stringify(roomData)
    }),

    // Update bed
    updateBed: (id, bedData) => apiRequest(`/beds/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bedData)
    }),

    // Delete bed
    deleteBed: (id) => apiRequest(`/beds/${id}`, {
        method: 'DELETE'
    }),
};

// Gender API functions
export const genderApi = {
    // Get all gender options
    getAll: () => apiRequest('/genders'),
};

// Payment API functions
export const paymentApi = {
    // Generate control number
    generateControlNumber: (paymentData) => apiRequest('/payments/generate-control-number', {
        method: 'POST',
        body: JSON.stringify(paymentData)
    }),

    // Check payment status
    checkStatus: (controlNumber) => apiRequest(`/payments/check-status/${controlNumber}`),

    // Verify payment
    verifyPayment: (paymentData) => apiRequest('/payments/verify', {
        method: 'POST',
        body: JSON.stringify(paymentData)
    }),

    // Get student payment amount
    getStudentAmount: (admissionNumber) => apiRequest(`/payment-hostels/student-amount/${admissionNumber}`),
};

// Booking API functions
export const bookingApi = {
    // Create new booking
    create: (bookingData) => apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
    }),

    // Get booking by control number
    getByControlNumber: (controlNumber) => apiRequest(`/bookings/control-number/${controlNumber}`),

    // Get bookings by student
    getByStudent: (studentId) => apiRequest(`/bookings/student/${studentId}`),

    // Update booking status
    updateStatus: (bookingId, status) => apiRequest(`/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    }),

    // Get all bookings
    getAll: () => apiRequest('/bookings'),
};

export default {
    hostel: hostelApi,
    room: roomApi,
    gender: genderApi,
    payment: paymentApi,
    booking: bookingApi,
};
