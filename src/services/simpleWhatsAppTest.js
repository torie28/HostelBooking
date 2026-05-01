// Simple WhatsApp test - most basic approach
const simpleWhatsAppTest = async () => {
    console.log('=== SIMPLE WHATSAPP TEST ===');

    // Hardcoded values from your working curl
    const apiKey = '851811f6992f5dc95abee23719797ad3-075d6b45-a548-4888-b792-193ce4970060';
    const baseUrl = 'grrp1j.api.infobip.com';

    // Log environment check
    console.log('Environment check:', {
        envApiKey: import.meta.env.VITE_INFOBIP_API_KEY,
        envBaseUrl: import.meta.env.VITE_INFOBIP_BASE_URL,
        usingHardcoded: true
    });

    // Test 1: Exact PHP code format (NO + prefix)
    console.log('TEST 1: Exact PHP code format');
    const request1 = {
        messages: [{
            from: "447860088970",
            to: "255760381510",
            messageId: "00d2cca6-20bd-466e-8b5b-f7ecea31bb9b",
            content: {
                templateName: "test_whatsapp_template_en",
                templateData: {
                    body: {
                        placeholders: ["Pastorie"]
                    }
                },
                language: "en"
            }
        }]
    };

    try {
        const response1 = await fetch(`https://${baseUrl}/whatsapp/1/message/template`, {
            method: 'POST',
            headers: {
                'Authorization': `App ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(request1)
        });

        const result1 = await response1.json();
        console.log('TEST 1 Response:', {
            status: response1.status,
            statusText: response1.statusText,
            data: result1
        });

    } catch (error) {
        console.error('TEST 1 Error:', error);
    }

    // Test 2: Simple text message (no template) with + prefix
    console.log('TEST 2: Simple text message with + prefix');
    const request2 = {
        messages: [{
            from: "+447860088970",
            to: "+255760381510",
            content: {
                text: "Simple test message from Hostel Booking System"
            }
        }]
    };

    try {
        const response2 = await fetch(`https://${baseUrl}/whatsapp/1/message/text`, {
            method: 'POST',
            headers: {
                'Authorization': `App ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(request2)
        });

        const result2 = await response2.json();
        console.log('TEST 2 Response:', {
            status: response2.status,
            statusText: response2.statusText,
            data: result2
        });

    } catch (error) {
        console.error('TEST 2 Error:', error);
    }

    // Test 3: Regular SMS (fallback)
    console.log('TEST 3: Regular SMS');
    const request3 = {
        messages: [{
            from: "HostelBooking",
            to: "+255760381510",
            text: "Test SMS from Hostel Booking System"
        }]
    };

    try {
        const response3 = await fetch(`https://${baseUrl}/sms/2/text/advanced`, {
            method: 'POST',
            headers: {
                'Authorization': `App ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(request3)
        });

        const result3 = await response3.json();
        console.log('TEST 3 Response:', {
            status: response3.status,
            statusText: response3.statusText,
            data: result3
        });

    } catch (error) {
        console.error('TEST 3 Error:', error);
    }

    // Test 4: Try without message ID and simple template
    console.log('TEST 4: Simple template without message ID');
    const request4 = {
        messages: [{
            from: "+447860088970",
            to: "+255760381510",
            content: {
                templateName: "test_whatsapp_template_en",
                templateData: {
                    body: {
                        placeholders: ["Test message"]
                    }
                },
                language: "en"
            }
        }]
    };

    try {
        const response4 = await fetch(`https://${baseUrl}/whatsapp/1/message/template`, {
            method: 'POST',
            headers: {
                'Authorization': `App ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(request4)
        });

        const result4 = await response4.json();
        console.log('TEST 4 Response:', {
            status: response4.status,
            statusText: response4.statusText,
            data: result4
        });

    } catch (error) {
        console.error('TEST 4 Error:', error);
    }

    // Test 5: WhatsApp text message (no template)
    console.log('TEST 5: WhatsApp text message');
    const request5 = {
        messages: [{
            from: "447860088970",
            to: "255760381510",
            content: {
                text: "Test WhatsApp text message from Hostel Booking System"
            }
        }]
    };

    try {
        const response5 = await fetch(`https://${baseUrl}/whatsapp/1/message/text`, {
            method: 'POST',
            headers: {
                'Authorization': `App ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(request5)
        });

        const result5 = await response5.json();
        console.log('TEST 5 Response:', {
            status: response5.status,
            statusText: response5.statusText,
            data: result5
        });

    } catch (error) {
        console.error('TEST 5 Error:', error);
    }

    console.log('=== END SIMPLE TEST ===');
};

export default simpleWhatsAppTest;
