class SMSService {
    constructor() {
        this.apiKey = import.meta.env.VITE_INFOBIP_API_KEY || '851811f6992f5dc95abee23719797ad3-075d6b45-a548-4888-b792-193ce4970060';
        this.baseUrl = import.meta.env.VITE_INFOBIP_BASE_URL || 'grrp1j.api.infobip.com';

        console.log('SMS Service initialized with:', {
            apiKey: this.apiKey ? 'Present' : 'Missing',
            baseUrl: this.baseUrl
        });
    }

    async sendSMS(to, message, options = {}) {
        if (!this.apiKey) {
            throw new Error('SMS API key not configured.');
        }

        const smsRequest = {
            messages: [{
                from: options.from || import.meta.env.VITE_SMS_SENDER_NAME || 'HostelBooking',
                destinations: [{ to }],
                text: message,
                ...options
            }]
        };

        try {
            const response = await fetch(`https://${this.baseUrl}/sms/2/text/advanced`, {
                method: 'POST',
                headers: {
                    'Authorization': `App ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(smsRequest)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
            }

            return {
                success: true,
                messageId: responseData.messages?.[0]?.messageId,
                status: responseData.messages?.[0]?.status
            };
        } catch (error) {
            console.error('SMS sending failed:', error);
            throw new Error(`SMS sending failed: ${error.message}`);
        }
    }

    async sendWhatsApp(to, message, options = {}) {
        const apiKey = import.meta.env.VITE_INFOBIP_API_KEY || '851811f6992f5dc95abee23719797ad3-075d6b45-a548-4888-b792-193ce4970060';
        const baseUrl = import.meta.env.VITE_INFOBIP_BASE_URL || 'grrp1j.api.infobip.com';

        console.log('Using API values:', {
            envApiKey: import.meta.env.VITE_INFOBIP_API_KEY,
            envBaseUrl: import.meta.env.VITE_INFOBIP_BASE_URL,
            finalApiKey: apiKey ? 'Present' : 'Missing',
            finalBaseUrl: baseUrl
        });

        if (!apiKey) {
            throw new Error('Infobip API key not found');
        }

        // Use exact same format as your working curl command
        const whatsappRequest = {
            messages: [{
                from: options.from || import.meta.env.VITE_WHATSAPP_SENDER_NUMBER || '447860088970',
                to: this.formatPhoneNumber(to),
                messageId: options.messageId || this.generateMessageId(),
                content: {
                    templateName: options.templateName || 'test_whatsapp_template_en',
                    templateData: {
                        body: {
                            placeholders: options.placeholders || [message]
                        }
                    },
                    language: 'en'
                }
            }]
        };

        console.log('Sending WhatsApp request:', {
            url: `${baseUrl}/whatsapp/1/message/template`,
            headers: {
                'Authorization': `App ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: whatsappRequest
        });

        try {
            const response = await fetch(`${baseUrl}/whatsapp/1/message/template`, {
                method: 'POST',
                headers: {
                    'Authorization': `App ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(whatsappRequest)
            });

            const responseData = await response.json();

            console.log('WhatsApp API response:', {
                status: response.status,
                data: responseData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
            }

            return {
                success: true,
                messageId: responseData.messages?.[0]?.messageId,
                status: responseData.messages?.[0]?.status,
                response: responseData
            };
        } catch (error) {
            console.error('WhatsApp sending failed:', error);
            throw new Error(`WhatsApp sending failed: ${error.message}`);
        }
    }

    generateMessageId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    async sendBookingConfirmation(phoneNumber, bookingDetails) {
        const message = `Dear ${bookingDetails.studentName},\n\nYour hostel booking has been confirmed!\n\nBooking Details:\n- Hostel: ${bookingDetails.hostelName}\n- Room: ${bookingDetails.roomNumber}\n- Bed: ${bookingDetails.bedNumber}\n- Check-in: ${bookingDetails.checkInDate}\n- Control Number: ${bookingDetails.controlNumber}\n\nPlease complete your payment using the control number above.\n\nThank you for choosing our hostel!`;

        // Send to customer via regular SMS
        const customerResult = await this.sendSMS(phoneNumber, message);

        // Send notification to admin via WhatsApp
        await this.notifyAdminBooking(bookingDetails);

        return customerResult;
    }

    async notifyAdminBooking(bookingDetails) {
        const adminNumber = import.meta.env.VITE_ADMIN_PHONE_NUMBER || '255760381510';
        const adminMessage = `🏠 NEW BOOKING ALERT 🏠\n\nStudent: ${bookingDetails.studentName}\nHostel: ${bookingDetails.hostelName}\nRoom: ${bookingDetails.roomNumber}\nBed: ${bookingDetails.bedNumber}\nControl Number: ${bookingDetails.controlNumber}\nCheck-in: ${bookingDetails.checkInDate}\nPhone: ${bookingDetails.phoneNumber}\n\nTime: ${new Date().toLocaleString()}`;

        console.log('Attempting to send WhatsApp notification:', {
            to: adminNumber,
            message: adminMessage,
            apiKey: import.meta.env.VITE_INFOBIP_API_KEY ? 'Present' : 'Missing',
            baseUrl: import.meta.env.VITE_INFOBIP_BASE_URL,
            senderNumber: import.meta.env.VITE_WHATSAPP_SENDER_NUMBER
        });

        try {
            // Try text message instead of template since template is blocked
            const whatsappRequest = {
                messages: [{
                    from: "447860088970",
                    to: adminNumber,
                    content: {
                        text: adminMessage
                    }
                }]
            };

            const response = await fetch(`https://${this.baseUrl}/whatsapp/1/message/text`, {
                method: 'POST',
                headers: {
                    'Authorization': `App ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(whatsappRequest)
            });

            const responseData = await response.json();

            console.log('WhatsApp notification sent:', {
                status: response.status,
                data: responseData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
            }

            return {
                success: true,
                messageId: responseData.messages?.[0]?.messageId,
                status: responseData.messages?.[0]?.status
            };
        } catch (error) {
            console.error('Failed to send admin WhatsApp notification:', error);
            // Don't fail the booking if admin notification fails
        }
    }

    // Test function for debugging
    async testWhatsAppConnection() {
        console.log('Testing WhatsApp connection...');
        console.log('Environment variables:', {
            apiKey: import.meta.env.VITE_INFOBIP_API_KEY ? 'Present' : 'Missing',
            baseUrl: import.meta.env.VITE_INFOBIP_BASE_URL,
            senderNumber: import.meta.env.VITE_WHATSAPP_SENDER_NUMBER,
            adminNumber: import.meta.env.VITE_ADMIN_PHONE_NUMBER
        });

        try {
            const testMessage = 'Test message from Hostel Booking System';
            const result = await this.sendWhatsApp('255760381510', testMessage, {
                templateName: 'test_whatsapp_template_en',
                placeholders: [testMessage]
            });
            console.log('Test WhatsApp message sent successfully:', result);
            return result;
        } catch (error) {
            console.error('Test WhatsApp message failed:', error);
            throw error;
        }
    }

    // Direct test using exact curl command format
    async testDirectCurl() {
        console.log('Testing with exact curl format...');

        const apiKey = import.meta.env.VITE_INFOBIP_API_KEY;
        const baseUrl = import.meta.env.VITE_INFOBIP_BASE_URL;

        // Debug: Log all environment variables
        console.log('All VITE_ env vars:', {
            VITE_INFOBIP_API_KEY: import.meta.env.VITE_INFOBIP_API_KEY ? 'Present' : 'Missing',
            VITE_INFOBIP_BASE_URL: import.meta.env.VITE_INFOBIP_BASE_URL,
            VITE_WHATSAPP_SENDER_NUMBER: import.meta.env.VITE_WHATSAPP_SENDER_NUMBER,
            VITE_ADMIN_PHONE_NUMBER: import.meta.env.VITE_ADMIN_PHONE_NUMBER,
            VITE_SMS_SENDER_NAME: import.meta.env.VITE_SMS_SENDER_NAME
        });

        // Hardcode values for testing if env vars are missing
        const testApiKey = apiKey || '851811f6992f5dc95abee23719797ad3-075d6b45-a548-4888-b792-193ce4970060';
        const testBaseUrl = baseUrl || 'grrp1j.api.infobip.com';

        console.log('Using values:', {
            apiKey: testApiKey ? 'Present' : 'Missing',
            baseUrl: testBaseUrl
        });

        const exactRequest = {
            messages: [{
                from: "447860088970",
                to: "255760381510",
                messageId: "1791b549-4068-4af5-a285-f604c404e22e",
                content: {
                    templateName: "test_whatsapp_template_en",
                    templateData: {
                        body: {
                            placeholders: ["Test from app"]
                        }
                    },
                    language: "en"
                }
            }]
        };

        console.log('Exact request being sent:', JSON.stringify(exactRequest, null, 2));

        try {
            const response = await fetch(`${testBaseUrl}/whatsapp/1/message/template`, {
                method: 'POST',
                headers: {
                    'Authorization': `App ${testApiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(exactRequest)
            });

            const responseData = await response.json();

            console.log('Direct test response:', {
                status: response.status,
                statusText: response.statusText,
                data: responseData
            });

            return {
                success: response.ok,
                status: response.status,
                data: responseData
            };
        } catch (error) {
            console.error('Direct test failed:', error);
            throw error;
        }
    }

    async sendPaymentReminder(phoneNumber, paymentDetails) {
        const message = `Dear ${paymentDetails.studentName},\n\nThis is a reminder that your hostel fee payment is pending.\n\nPayment Details:\n- Control Number: ${paymentDetails.controlNumber}\n- Amount: ${paymentDetails.amount}\n- Due Date: ${paymentDetails.dueDate}\n\nPlease complete your payment to avoid any inconvenience.\n\nThank you!`;

        return this.sendSMS(phoneNumber, message);
    }

    async sendBookingCancellation(phoneNumber, bookingDetails) {
        const message = `Dear ${bookingDetails.studentName},\n\nYour hostel booking has been cancelled.\n\nCancelled Booking Details:\n- Hostel: ${bookingDetails.hostelName}\n- Room: ${bookingDetails.roomNumber}\n- Bed: ${bookingDetails.bedNumber}\n- Control Number: ${bookingDetails.controlNumber}\n\nIf you did not request this cancellation, please contact us immediately.\n\nThank you!`;

        return this.sendSMS(phoneNumber, message);
    }

    async sendWelcomeMessage(phoneNumber, studentName, hostelName) {
        const message = `Welcome to ${hostelName}, ${studentName}!\n\nWe're excited to have you with us. If you need any assistance during your stay, please don't hesitate to contact our support team.\n\nEnjoy your stay!\n\nHostel Management`;

        return this.sendSMS(phoneNumber, message);
    }

    async sendMaintenanceAlert(phoneNumber, maintenanceDetails) {
        const message = `Maintenance Alert:\n\n${maintenanceDetails.message}\n\nLocation: ${maintenanceDetails.location}\nExpected Duration: ${maintenanceDetails.duration}\n\nWe apologize for any inconvenience caused.\n\nHostel Management`;

        return this.sendSMS(phoneNumber, message);
    }

    async checkDeliveryStatus(messageId) {
        if (!this.client) {
            throw new Error('SMS client not initialized');
        }

        try {
            const response = await this.client.sms.getDeliveryReports({ messageId });
            return response.data;
        } catch (error) {
            console.error('Failed to get delivery status:', error);
            throw new Error(`Failed to get delivery status: ${error.message}`);
        }
    }

    formatPhoneNumber(phoneNumber) {
        // Remove all non-numeric characters
        let cleaned = phoneNumber.replace(/\D/g, '');

        // Add country code if missing (assuming Tanzania - +255)
        if (cleaned.length === 9 && cleaned.startsWith('0')) {
            cleaned = '255' + cleaned.substring(1);
        } else if (cleaned.length === 9 && !cleaned.startsWith('255')) {
            cleaned = '255' + cleaned;
        } else if (cleaned.length === 12 && !cleaned.startsWith('255')) {
            // If it starts with other country code, keep as is
            cleaned = '+' + cleaned;
        } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
            cleaned = '255' + cleaned.substring(1);
        }

        return cleaned.startsWith('+') ? cleaned : '+' + cleaned;
    }
}

export default new SMSService();
