import React, { useState } from 'react';
import smsService from '../services/smsService';
import simpleWhatsAppTest from '../services/simpleWhatsAppTest';

const SMSTest = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const testWhatsApp = async () => {
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await smsService.testWhatsAppConnection();
            setResult(response);
            console.log('WhatsApp test successful:', response);
        } catch (err) {
            setError(err.message);
            console.error('WhatsApp test failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const testBookingNotification = async () => {
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const bookingDetails = {
                studentName: 'Test Student',
                hostelName: 'Test Hostel',
                roomNumber: 'Room A',
                bedNumber: 'Bed 1',
                controlNumber: '123456789',
                checkInDate: '2026-04-20',
                phoneNumber: '+255712345678'
            };

            await smsService.notifyAdminBooking(bookingDetails);
            setResult({ message: 'Booking notification sent successfully' });
            console.log('Booking notification test successful');
        } catch (err) {
            setError(err.message);
            console.error('Booking notification test failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const testDirectCurl = async () => {
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await smsService.testDirectCurl();
            setResult(response);
            console.log('Direct curl test successful:', response);
        } catch (err) {
            setError(err.message);
            console.error('Direct curl test failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const testSimpleWhatsApp = async () => {
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            await simpleWhatsAppTest();
            setResult({ message: 'Simple WhatsApp test completed - check console for details' });
        } catch (err) {
            setError(err.message);
            console.error('Simple WhatsApp test failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">SMS/WhatsApp Test</h2>

            <div className="space-y-4">
                <button
                    onClick={testSimpleWhatsApp}
                    disabled={loading}
                    className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400"
                >
                    {loading ? 'Testing...' : 'Test Simple WhatsApp (3 Methods)'}
                </button>

                <button
                    onClick={testDirectCurl}
                    disabled={loading}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
                >
                    {loading ? 'Testing...' : 'Test Direct Curl (Exact Match)'}
                </button>

                <button
                    onClick={testWhatsApp}
                    disabled={loading}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                    {loading ? 'Testing...' : 'Test WhatsApp Connection'}
                </button>

                <button
                    onClick={testBookingNotification}
                    disabled={loading}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                    {loading ? 'Testing...' : 'Test Booking Notification'}
                </button>
            </div>

            {result && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                    <h3 className="font-semibold text-green-800">Success:</h3>
                    <pre className="text-sm text-green-700 whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded">
                    <h3 className="font-semibold text-red-800">Error:</h3>
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded">
                <h3 className="font-semibold text-gray-800 mb-2">Debug Info:</h3>
                <p className="text-sm text-gray-600">
                    Check the browser console for detailed logs and environment variable status.
                </p>
                <p className="text-sm text-gray-600 mt-1">
                    Make sure your .env.local file contains the correct Infobip credentials.
                </p>
            </div>
        </div>
    );
};

export default SMSTest;
