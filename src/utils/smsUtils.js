import smsService from '../services/smsService';

export const smsUtils = {
    // Test SMS connection
    async testConnection(testPhoneNumber = '+255712345678') {
        try {
            const result = await smsService.sendSMS(
                testPhoneNumber,
                'Test message from Hostel Booking System. SMS integration is working correctly!'
            );
            return {
                success: true,
                message: 'SMS test sent successfully',
                messageId: result.messageId
            };
        } catch (error) {
            return {
                success: false,
                message: `SMS test failed: ${error.message}`
            };
        }
    },

    // Validate phone number format
    validatePhoneNumber(phoneNumber) {
        if (!phoneNumber) {
            return { valid: false, message: 'Phone number is required' };
        }

        const cleaned = phoneNumber.replace(/\D/g, '');
        
        // Check if it's a valid Tanzanian number
        if (cleaned.length === 9 && cleaned.match(/^[67]/)) {
            return { valid: true, formatted: smsService.formatPhoneNumber(phoneNumber) };
        }
        
        if (cleaned.length === 12 && cleaned.startsWith('255') && cleaned.match(/^255[67]/)) {
            return { valid: true, formatted: smsService.formatPhoneNumber(phoneNumber) };
        }
        
        if (cleaned.length === 10 && cleaned.startsWith('0') && cleaned.match(/^0[67]/)) {
            return { valid: true, formatted: smsService.formatPhoneNumber(phoneNumber) };
        }
        
        return { valid: false, message: 'Invalid Tanzanian phone number format' };
    },

    // Check if SMS service is configured
    isConfigured() {
        const apiKey = import.meta.env.VITE_INFOBIP_API_KEY;
        const baseUrl = import.meta.env.VITE_INFOBIP_BASE_URL;
        
        return {
            configured: !!(apiKey && baseUrl),
            hasApiKey: !!apiKey,
            hasBaseUrl: !!baseUrl
        };
    },

    // Get SMS configuration status
    getConfigurationStatus() {
        const status = this.isConfigured();
        
        if (!status.configured) {
            let message = 'SMS service is not properly configured. Missing:';
            if (!status.hasApiKey) message += ' API key';
            if (!status.hasBaseUrl) message += ' Base URL';
            return { configured: false, message };
        }
        
        return { configured: true, message: 'SMS service is properly configured' };
    },

    // Send custom SMS (for admin use)
    async sendCustomSMS(phoneNumber, message) {
        const validation = this.validatePhoneNumber(phoneNumber);
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        return await smsService.sendSMS(validation.formatted, message);
    },

    // Get SMS templates
    getTemplates() {
        return {
            bookingConfirmation: 'Dear {studentName},\n\nYour hostel booking has been confirmed!\n\nBooking Details:\n- Hostel: {hostelName}\n- Room: {roomNumber}\n- Bed: {bedNumber}\n- Check-in: {checkInDate}\n- Control Number: {controlNumber}\n\nPlease complete your payment using the control number above.\n\nThank you for choosing our hostel!',
            
            paymentReminder: 'Dear {studentName},\n\nThis is a reminder that your hostel fee payment is pending.\n\nPayment Details:\n- Control Number: {controlNumber}\n- Amount: {amount}\n- Due Date: {dueDate}\n\nPlease complete your payment to avoid any inconvenience.\n\nThank you!',
            
            bookingCancellation: 'Dear {studentName},\n\nYour hostel booking has been cancelled.\n\nCancelled Booking Details:\n- Hostel: {hostelName}\n- Room: {roomNumber}\n- Bed: {bedNumber}\n- Control Number: {controlNumber}\n\nIf you did not request this cancellation, please contact us immediately.\n\nThank you!',
            
            welcomeMessage: 'Welcome to {hostelName}, {studentName}!\n\nWe\'re excited to have you with us. If you need any assistance during your stay, please don\'t hesitate to contact our support team.\n\nEnjoy your stay!\n\nHostel Management',
            
            paymentConfirmation: 'Payment Confirmation:\n\nDear {studentName},\n\nYour payment of {amount} has been successfully received.\nControl Number: {controlNumber}\nTransaction ID: {transactionId}\n\nThank you for your payment!'
        };
    }
};

export default smsUtils;
