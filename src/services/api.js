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
    generateControlNumber: async (paymentData) => {
        const result = await apiRequest('/payments/generate-control-number', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });

        // Send payment reminder SMS after generating control number
        if (result.success && paymentData.phoneNumber) {
            try {
                const { default: smsService } = await import('./smsService');
                await smsService.sendPaymentReminder(
                    smsService.formatPhoneNumber(paymentData.phoneNumber),
                    {
                        studentName: paymentData.studentName,
                        controlNumber: result.controlNumber,
                        amount: paymentData.amount,
                        dueDate: paymentData.dueDate
                    }
                );
            } catch (smsError) {
                console.error('Failed to send payment reminder SMS:', smsError);
            }
        }

        return result;
    },

    // Check payment status
    checkStatus: (controlNumber) => apiRequest(`/payments/check-status/${controlNumber}`),

    // Verify payment
    verifyPayment: async (paymentData) => {
        const result = await apiRequest('/payments/verify', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });

        // Send confirmation SMS after successful payment
        if (result.success && paymentData.phoneNumber && result.status === 'completed') {
            try {
                const { default: smsService } = await import('./smsService');
                await smsService.sendSMS(
                    smsService.formatPhoneNumber(paymentData.phoneNumber),
                    `Payment Confirmation:\n\nDear ${paymentData.studentName},\n\nYour payment of ${paymentData.amount} has been successfully received.\nControl Number: ${paymentData.controlNumber}\nTransaction ID: ${result.transactionId}\n\nThank you for your payment!`
                );
            } catch (smsError) {
                console.error('Failed to send payment confirmation SMS:', smsError);
            }
        }

        return result;
    },

    // Get student payment amount
    getStudentAmount: (admissionNumber) => apiRequest(`/payment-hostels/student-amount/${admissionNumber}`),
};

// Booking API functions
export const bookingApi = {
    // Create new booking
    create: async (bookingData) => {
        const result = await apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        });

        console.log('🎯 BOOKING CREATED - Checking notifications...');
        // Send SMS notification after successful booking
        console.log('🔍 Notification check:', {
            success: result.success,
            hasPhone: !!bookingData.phoneNumber,
            phone: bookingData.phoneNumber,
            result
        });

        if (result.success && bookingData.phoneNumber) {
            try {
                const { default: smsService } = await import('./smsService');

                // Send SMS to customer
                await smsService.sendBookingConfirmation(
                    smsService.formatPhoneNumber(bookingData.phoneNumber),
                    {
                        studentName: bookingData.studentName,
                        hostelName: bookingData.hostelName,
                        roomNumber: bookingData.roomNumber,
                        bedNumber: bookingData.bedNumber,
                        checkInDate: bookingData.checkInDate,
                        controlNumber: result.controlNumber || bookingData.controlNumber
                    }
                );

                console.log('📱 Sending WhatsApp to admin...');
                // Send WhatsApp notification to admin
                await smsService.notifyAdminBooking({
                    studentName: bookingData.studentName,
                    hostelName: bookingData.hostelName,
                    roomNumber: bookingData.roomNumber,
                    bedNumber: bookingData.bedNumber,
                    checkInDate: bookingData.checkInDate,
                    controlNumber: result.controlNumber || bookingData.controlNumber,
                    phoneNumber: bookingData.phoneNumber
                });
                console.log('✅ WhatsApp notification sent successfully!');

            } catch (smsError) {
                console.error('Failed to send booking notifications:', smsError);
                // Don't fail the booking if SMS fails
            }
        }

        return result;
    },

    // Get booking by control number
    getByControlNumber: (controlNumber) => apiRequest(`/bookings/control-number/${controlNumber}`),

    // Get bookings by student
    getByStudent: (studentId) => apiRequest(`/bookings/student/${studentId}`),

    // Update booking status
    updateStatus: async (bookingId, status, phoneNumber = null, studentName = null) => {
        const result = await apiRequest(`/bookings/${bookingId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        // Send SMS notification for status changes
        if (result.success && phoneNumber) {
            try {
                const { default: smsService } = await import('./smsService');
                if (status === 'cancelled') {
                    await smsService.sendBookingCancellation(
                        smsService.formatPhoneNumber(phoneNumber),
                        {
                            studentName,
                            hostelName: result.hostelName,
                            roomNumber: result.roomNumber,
                            bedNumber: result.bedNumber,
                            controlNumber: result.controlNumber
                        }
                    );
                }
            } catch (smsError) {
                console.error('Failed to send status update SMS:', smsError);
            }
        }

        return result;
    },

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
