import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hostelApi, roomApi, paymentApi, bookingApi } from '../../../services/api';

export function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [selectedGender, setSelectedGender] = useState('');
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedBed, setSelectedBed] = useState(null);
    const [selectedBedForInfo, setSelectedBedForInfo] = useState(null);
    const [roomBeds, setRoomBeds] = useState([]);
    const [roomSearchTerm, setRoomSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'all'
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [admissionNumber, setAdmissionNumber] = useState('');
    const [studentName, setStudentName] = useState('');
    const [controlNumber, setControlNumber] = useState('');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingModalData, setBookingModalData] = useState(null);
    const [controlNumberGenerated, setControlNumberGenerated] = useState(false);
    const [studentBooking, setStudentBooking] = useState(null);
    const [amount, setAmount] = useState('');
    const [academicYear, setAcademicYear] = useState('');
    const navigate = useNavigate();

    // Helper function to convert numbers to words
    const numberToWords = (num) => {
        const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
        const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

        if (num === 0) return 'Zero';

        const convert = (n) => {
            if (n < 10) return ones[n];
            if (n < 20) return teens[n - 10];
            if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
            if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
            if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
            if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
            return convert(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 ? ' ' + convert(n % 1000000000) : '');
        };

        return convert(num);
    };

    // Fetch beds for a specific room
    const fetchRoomBeds = async (roomId) => {
        try {
            const bedsData = await roomApi.getRoomBeds(roomId);
            setRoomBeds(bedsData);
        } catch (error) {
            console.error('Error fetching room beds:', error);
            // Fallback to empty array if API fails
            setRoomBeds([]);
        }
    };

    // Fetch hostels from database
    const fetchHostels = async () => {
        try {
            setLoading(true);
            setError(null);
            const hostelsData = await hostelApi.getAll();
            // Transform the data to match the expected structure
            const transformedHostels = hostelsData.map(hostel => ({
                id: hostel.id,
                name: hostel.name,
                gender: hostel.gender,
                totalCapacity: hostel.capacity || 100,
                availableRooms: hostel.available_rooms || 0,
                rooms: hostel.rooms || [],
                status: hostel.status || 'active'
            }));
            setHostels(transformedHostels);
        } catch (err) {
            console.error('Error fetching hostels:', err);
            setError('Failed to load hostels. Please try again.');
            // Fallback to mock data if API fails

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Get user data from localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                // Auto-select gender based on user data if available
                if (parsedUser.gender) {
                    setSelectedGender(parsedUser.gender);
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                // Clear corrupted data and redirect to login
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                navigate('/');
            }
        } else {
            // Redirect to login if no user data
            navigate('/');
        }

        // Fetch hostels from database
        fetchHostels();

        // Load existing booking from localStorage
        const existingBooking = localStorage.getItem('studentBooking');
        if (existingBooking) {
            try {
                const parsedBooking = JSON.parse(existingBooking);
                setStudentBooking(parsedBooking);
            } catch (error) {
                console.error('Error parsing booking data:', error);
                localStorage.removeItem('studentBooking');
            }
        }
    }, [navigate]);

    const filteredHostels = selectedGender
        ? hostels.filter(hostel => hostel.gender === selectedGender)
        : [];

    const filteredRooms = selectedHostel && roomSearchTerm
        ? selectedHostel.rooms.filter(room =>
            room.room_number.toLowerCase().includes(roomSearchTerm.toLowerCase())
        )
        : selectedHostel?.rooms || [];

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        navigate('/');
    };

    const handleBedSelection = (bedId) => {
        setSelectedBed(bedId);

        // Find the bed object to get bed details
        const selectedBedObject = roomBeds.find(bed => bed.id === bedId);
        if (selectedBedObject) {
            setSelectedBedForInfo({
                bedId: bedId,
                bedNumber: selectedBedObject.bed_number,
                roomNumber: selectedRoom.room_number,
                hostelName: selectedHostel.name
            });
        } else {
            // Fallback for generated beds
            setSelectedBedForInfo({
                bedId: bedId,
                bedNumber: bedId,
                roomNumber: selectedRoom.room_number,
                hostelName: selectedHostel.name
            });
        }
    };

    // Booking form functions
    const generateControlNumber = () => {
        // Generate control number starting with 99 + 10 random digits (12 digits total)
        const controlNumber = '99' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        setControlNumber(controlNumber);
        setControlNumberGenerated(true);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();

        if (!selectedHostel || !selectedRoom || !selectedBed || !admissionNumber || !studentName || !amount || !academicYear) {
            alert('Please fill in all required fields');
            return;
        }

        setIsLoading(true);

        try {
            // Prepare booking data for database
            const bookingData = {
                hostel_id: selectedHostel.id,
                room_number: selectedRoom.room_number,
                bed_id: selectedBed, // Assuming selectedBed contains the bed ID
                status: 'active', // Using 'active' as per database enum
                academic_year: academicYear,
                student_name: studentName,
                admission_number: admissionNumber,
                amount: parseFloat(amount),
                controlnumber: controlNumber,
                booking_date: new Date().toISOString().split('T')[0] // Format as YYYY-MM-DD
            };

            console.log('Booking data:', bookingData);

            // Save booking to database via API
            const savedBooking = await bookingApi.create(bookingData);

            // Prepare display data (keeping existing structure for frontend)
            const displayData = {
                studentName,
                admissionNumber,
                hostel: selectedHostel.name,
                room: selectedRoom.room_number,
                bed: selectedBed,
                controlNumber,
                amount,
                academicYear,
                status: 'booked', // Keep 'booked' for frontend display
                timestamp: new Date().toISOString(),
                id: savedBooking.id // Include database ID
            };

            // Set modal data and show modal
            setBookingModalData(displayData);
            setShowBookingModal(true);

            // Save booking to student state and localStorage
            setStudentBooking(displayData);
            localStorage.setItem('studentBooking', JSON.stringify(displayData));

            // Generate a new control number for next booking
            generateControlNumber();

            // Reset form and close booking form
            setShowBookingForm(false);
            setSelectedBedForInfo(null);
            setSelectedBed(null);

        } catch (error) {
            console.error('Booking error:', error);
            alert('Failed to complete booking. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmBooking = () => {
        // Auto-fill user data
        if (user) {
            setStudentName(user.name || '');
            setAdmissionNumber(user.admissionNumber || '');
        }
        // Reset control number generation state
        setControlNumberGenerated(false);
        setControlNumber('');
        // Reset new fields
        setAmount('');
        setAcademicYear('');
        // Show booking form
        setShowBookingForm(true);
    };

    const handleGenerateControlNumber = () => {
        generateControlNumber();
    };

    const handlePrintReceipt = async () => {
        if (!studentBooking) return;

        // Fetch student's actual payment amount from database
        let paymentAmount = studentBooking.amount;
        try {
            const paymentResponse = await paymentApi.getStudentAmount(studentBooking.admissionNumber);
            if (paymentResponse.success) {
                paymentAmount = paymentResponse.amount;
            }
        } catch (error) {
            console.error('Error fetching payment amount:', error);
            // Use booking amount if API fails
        }

        // Create a classic printable receipt matching ATC format
        const receiptContent = `
            <html>
                <head>
                    <title>ATC - Exchequer Receipts</title>
                    <style>
                        body { 
                            font-family: 'Courier New', monospace; 
                            padding: 15px; 
                            margin: 0;
                            font-size: 11px;
                            line-height: 1.2;
                            background: #fff;
                        }
                        .receipt-container {
                            max-width: 400px;
                            margin: 0 auto;
                            border: 2px solid #000;
                            padding: 20px;
                            background: #fff9f0;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 15px; 
                            border-bottom: 3px double #000;
                            padding-bottom: 10px;
                        }
                        .header h1 { 
                            margin: 5px 0;
                            font-size: 16px;
                            font-weight: bold;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        .header p { 
                            margin: 2px 0;
                            font-size: 12px;
                            font-weight: bold;
                        }
                        .receipt-details { 
                            margin: 10px 0; 
                        }
                        .receipt-details p { 
                            margin: 3px 0; 
                            line-height: 1.1;
                        }
                        .items-section {
                            margin: 15px 0;
                            border: 1px solid #666;
                            padding: 10px;
                        }
                        .items-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 10px 0;
                        }
                        .items-table th {
                            text-align: left;
                            padding: 5px;
                            border-bottom: 2px solid #000;
                            font-weight: bold;
                            font-size: 10px;
                            text-transform: uppercase;
                        }
                        .items-table td {
                            padding: 5px;
                            font-size: 10px;
                            border-bottom: 1px dashed #ccc;
                        }
                        .total-row {
                            font-weight: bold;
                            border-top: 2px solid #000;
                            border-bottom: 2px solid #000;
                            background: #f0f0f0;
                        }
                        .total-row td {
                            font-size: 11px;
                            padding: 8px 5px;
                        }
                        .footer { 
                            margin-top: 15px; 
                            text-align: center;
                            border-top: 2px solid #000;
                            padding-top: 10px;
                        }
                        .footer p {
                            margin: 2px 0;
                            font-size: 9px;
                            font-style: italic;
                        }
                        .watermark {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%) rotate(-45deg);
                            font-size: 72px;
                            color: rgba(0,0,0,0.05);
                            font-weight: bold;
                            pointer-events: none;
                        }
                        .receipt-number {
                            font-size: 14px;
                            font-weight: bold;
                            text-decoration: underline;
                        }
                        .amount-section {
                            background: #f8f8f8;
                            padding: 10px;
                            border: 1px solid #ddd;
                            margin: 10px 0;
                        }
                        .control-section {
                            border: 2px solid #000;
                            padding: 8px;
                            margin: 10px 0;
                            background: #ffffcc;
                        }
                        @media print {
                            body { padding: 0; }
                            .receipt-container { 
                                margin: 0; 
                                border: none;
                                box-shadow: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        <div class="watermark">PAID</div>
                        
                        <div class="header">
                            <h1>ATC - Arusha Technical College</h1>
                            <p>Exchequer Receipts</p>
                            <p style="font-size: 9px; margin-top: 5px;">Official Government Receipt</p>
                        </div>
                        
                        <div class="receipt-details">
                            <p><strong>Receipt No:</strong> <span class="receipt-number">${studentBooking.controlNumber}</span></p>
                            <p><strong>Received from:</strong> ${studentBooking.studentName}</p>
                            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                        </div>

                        <div class="amount-section">
                            <p><strong>Amount:</strong> ${paymentAmount.toLocaleString()}.00 TZS</p>
                            <p><strong>Amount In Words:</strong> ${numberToWords(paymentAmount)} Tanzanian Shillings Only</p>
                            <p><strong>Outstanding Balance:</strong> 0.00 TZS</p>
                        </div>

                        <div class="items-section">
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Item Description</th>
                                        <th style="text-align: right;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Hostel Booking Fee</td>
                                        <td style="text-align: right;">${paymentAmount.toLocaleString()}.00</td>
                                    </tr>
                                    <tr class="total-row">
                                        <td><strong>Total Billed Amount</strong></td>
                                        <td style="text-align: right;"><strong>${paymentAmount.toLocaleString()}.00</strong></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="control-section">
                            <p><strong>Bill Reference:</strong> ${studentBooking.admissionNumber}</p>
                            <p><strong>Payment Control No:</strong> ${studentBooking.controlNumber}</p>
                            <p><strong>Academic Year:</strong> ${studentBooking.academicYear}</p>
                        </div>

                        <div class="receipt-details">
                            <p><strong>Hostel:</strong> ${studentBooking.hostel}</p>
                            <p><strong>Room:</strong> ${studentBooking.room}</p>
                            <p><strong>Bed:</strong> ${studentBooking.bed}</p>
                        </div>

                        <div class="footer">
                            <p>This is an official government receipt - Do not alter</p>
                            <p>Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                            <p style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 5px; text-align: center;">
                                _________________________<br>
                                Authorized Signature
                            </p>
                        </div>
                    </div>
                </body>
            </html>
        `;

        // Open print dialog
        const printWindow = window.open('', '_blank');
        printWindow.document.write(receiptContent);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    };

    // Get all rooms from all hostels based on gender filter
    const getAllRooms = () => {
        if (!selectedGender) return [];

        const allRooms = [];
        filteredHostels.forEach(hostel => {
            hostel.rooms.forEach(room => {
                allRooms.push({
                    ...room,
                    hostelName: hostel.name,
                    hostelId: hostel.id,
                    hostelGender: hostel.gender,
                    hostelCapacity: hostel.totalCapacity
                });
            });
        });

        return allRooms;
    };

    const allFilteredRooms = getAllRooms().filter(room =>
        room.room_number.toLowerCase().includes(roomSearchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header with user info */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
                            {user && (
                                <p className="text-lg text-gray-600 mt-2">
                                    Welcome, <span className="font-bold text-black">{user.name || user.email || 'Student'}</span>
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-black hover:bg-black/80 text-white px-4 py-2 rounded-full transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Current Booking Information */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Current Booking</h2>
                    {studentBooking ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Hostel</p>
                                    <p className="font-semibold text-green-800">{studentBooking.hostel}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Room</p>
                                    <p className="font-semibold text-green-800">{studentBooking.room}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Bed</p>
                                    <p className="font-semibold text-green-800">{studentBooking.bed}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Control Number</p>
                                    <p className="font-semibold text-green-800">{studentBooking.controlNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-semibold px-2 py-1 rounded-full text-xs ${studentBooking.status === 'paid'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {studentBooking.status === 'paid' ? '✓ Paid' : '⏳ Booked'}
                                        </span>
                                        {studentBooking.status === 'booked' && (
                                            <button
                                                onClick={handlePrintReceipt}
                                                className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-full transition-colors"
                                            >
                                                Print Receipt
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-yellow-700">You haven't booked any hostel, room, or bed yet. Please complete your booking below.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Step 1: Gender Selection */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">1. Select Hostel Based on Gender</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => {
                                setSelectedGender('male');
                                setSelectedHostel(null);
                                setSelectedRoom(null);
                                setSelectedBed(null);
                            }}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedGender === 'male'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <div className="text-center">
                                <div className="text-2xl mb-2">👨</div>
                                <div className="font-medium">Boys Hostel</div>
                                <div className="text-sm text-gray-600">2 hostels available</div>
                            </div>
                        </button>
                        <button
                            onClick={() => {
                                setSelectedGender('female');
                                setSelectedHostel(null);
                                setSelectedRoom(null);
                                setSelectedBed(null);
                            }}
                            className={`p-4 rounded-lg border-2 transition-all ${selectedGender === 'female'
                                ? 'border-pink-500 bg-pink-50'
                                : 'border-gray-300 hover:border-gray-400'
                                }`}
                        >
                            <div className="text-center">
                                <div className="text-2xl mb-2">👩</div>
                                <div className="font-medium">Girls Hostel</div>
                                <div className="text-sm text-gray-600">2 hostels available</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Step 2: Hostel Selection */}
                {selectedGender && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">2. Select Hostel</h2>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                <span className="ml-3 text-gray-600">Loading hostels...</span>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-red-700">{error}</span>
                                </div>
                                <button
                                    onClick={fetchHostels}
                                    className="mt-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Hostels List */}
                        {!loading && !error && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredHostels.length > 0 ? (
                                    filteredHostels.map((hostel) => (
                                        <div
                                            key={hostel.id}
                                            onClick={() => {
                                                if (hostel.status === 'active') {
                                                    setSelectedHostel(hostel);
                                                    setSelectedRoom(null);
                                                    setSelectedBed(null);
                                                }
                                            }}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedHostel?.id === hostel.id
                                                ? 'border-green-500 bg-green-50'
                                                : hostel.status === 'active'
                                                    ? 'border-gray-300 hover:border-gray-400'
                                                    : 'border-red-300 bg-red-50 cursor-not-allowed'
                                                }`}
                                        >
                                            <h3 className="font-semibold text-lg">{hostel.name}</h3>
                                            <div className="text-sm text-gray-600 mt-2">
                                                <p>Total Capacity: {hostel.totalCapacity} students</p>
                                                <p>Available Rooms: {hostel.availableRooms}</p>
                                                <p>Gender: {hostel.gender === 'male' ? 'Boys' : 'Girls'}</p>
                                                <div className="mt-2">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${hostel.status === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : hostel.status === 'maintenance'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {hostel.status === 'active' ? '✓ Active' : hostel.status === 'maintenance' ? '🔧 Maintenance' : '✗ Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                            {hostel.status !== 'active' && (
                                                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                                    {hostel.status === 'maintenance' ? 'This hostel is under maintenance.' : 'This hostel is currently unavailable.'}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-8">
                                        <p className="text-gray-500">No hostels available for {selectedGender === 'male' ? 'boys' : 'girls'}.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Hostel Details */}
                {selectedHostel && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">3. Hostel Details</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="font-semibold">{selectedHostel.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Capacity</p>
                                    <p className="font-semibold">{selectedHostel.totalCapacity}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Gender</p>
                                    <p className="font-semibold">{selectedHostel.gender === 'male' ? 'Boys' : 'Girls'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Available Rooms</p>
                                    <p className="font-semibold">{selectedHostel.availableRooms}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedHostel.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : selectedHostel.status === 'maintenance'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                        {selectedHostel.status === 'active' ? '✓ Active' : selectedHostel.status === 'maintenance' ? '🔧 Maintenance' : '✗ Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Available Rooms */}
                {selectedHostel && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">4. Available Rooms</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-4 py-2 rounded-full transition-colors ${viewMode === 'grid'
                                        ? 'bg-black text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    Grid View
                                </button>
                                <button
                                    onClick={() => setViewMode('all')}
                                    className={`px-4 py-2 rounded-full transition-colors ${viewMode === 'all'
                                        ? 'bg-black/60 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    All Rooms View
                                </button>
                            </div>
                        </div>

                        {viewMode === 'grid' ? (
                            <>
                                {/* Room Search Filter */}
                                {selectedHostel.status === 'active' ? (
                                    <div className="mb-6">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search room by number (e.g., 101, 102)..."
                                                value={roomSearchTerm}
                                                onChange={(e) => {
                                                    setRoomSearchTerm(e.target.value);
                                                    setSelectedRoom(null);
                                                    setSelectedBed(null);
                                                }}
                                                className="w-2/4 px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-full"
                                            />
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                            {roomSearchTerm && (
                                                <button
                                                    onClick={() => {
                                                        setRoomSearchTerm('');
                                                        setSelectedRoom(null);
                                                        setSelectedBed(null);
                                                    }}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                                >
                                                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                        {roomSearchTerm && (
                                            <p className="mt-2 text-sm text-gray-600">
                                                Found {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} matching "{roomSearchTerm}"
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-700">
                                            {selectedHostel.status === 'maintenance' ?
                                                '🔧 This hostel is currently under maintenance. Room selection is not available.' :
                                                '✗ This hostel is currently inactive. Room selection is not available.'
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Rooms Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredRooms.length > 0 ? (
                                        filteredRooms.map((room) => (
                                            <div
                                                key={room.id}
                                                onClick={() => {
                                                    if (room.status === 'available' || room.status === 'full') {
                                                        setSelectedRoom(room);
                                                        setSelectedBed(null);
                                                        setRoomBeds([]); // Clear previous beds
                                                        fetchRoomBeds(room.id); // Fetch beds for this room
                                                    }
                                                }}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedRoom?.id === room.id
                                                    ? 'border-green-500 bg-green-50'
                                                    : room.status === 'available'
                                                        ? 'border-gray-300 hover:border-gray-400'
                                                        : 'border-red-300 bg-red-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                <h3 className="font-semibold text-lg">{room.room_number}</h3>
                                                <div className="text-sm text-gray-600 mt-2">
                                                    <p>Capacity: {room.capacity} beds</p>
                                                    {/* <p>Occupied: {room.occupied_beds || 0}/{room.capacity}</p> */}
                                                    <p>Available: {room.available_beds || room.capacity - (room.occupied_beds || 0)} beds</p>
                                                    <div className="mt-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${room.status === 'available'
                                                            ? 'bg-green-100 text-green-800'
                                                            : room.status === 'full'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {room.status === 'available' ? '✓ Available' : room.status === 'full' ? '✗ Full' : '⚠ Maintenance'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-8">
                                            <p className="text-gray-500">No rooms available matching "{roomSearchTerm}"</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                {/* All Rooms View */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Room</th>
                                                <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Capacity</th>
                                                {/* <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Occupied</th> */}
                                                <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Available</th>
                                                <th className="border border-gray-200 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {allFilteredRooms.length > 0 ? (
                                                allFilteredRooms.map((room) => (
                                                    <tr
                                                        key={room.id}
                                                        onClick={() => {
                                                            if (room.status === 'available' || room.status === 'full') {
                                                                setSelectedRoom(room);
                                                                setSelectedBed(null);
                                                                setRoomBeds([]); // Clear previous beds
                                                                fetchRoomBeds(room.id); // Fetch beds for this room
                                                            }
                                                        }}
                                                        className={`cursor-pointer transition-colors ${selectedRoom?.id === room.id
                                                            ? 'bg-green-50'
                                                            : 'hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <td className="border border-gray-200 px-4 py-3 text-sm">
                                                            <div className="flex items-center">
                                                                <span className="font-medium">{room.room_number}</span>
                                                                {selectedRoom?.id === room.id && (
                                                                    <span className="ml-2 text-green-600">✓</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-3 text-sm">{room.capacity}</td>
                                                        {/* <td className="border border-gray-200 px-4 py-3 text-sm">{room.occupied_beds || 0}</td> */}
                                                        <td className="border border-gray-200 px-4 py-3 text-sm">{room.available_beds || room.capacity - (room.occupied_beds || 0)}</td>
                                                        <td className="border border-gray-200 px-4 py-3 text-sm">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${room.status === 'available'
                                                                ? 'bg-green-100 text-green-800'
                                                                : room.status === 'full'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {room.status === 'available' ? '✓ Available' : room.status === 'full' ? '✗ Full' : '⚠ Maintenance'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="border border-gray-200 px-4 py-8 text-center text-gray-500">
                                                        No rooms available matching "{roomSearchTerm}"
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Step 5: Bed Selection */}
                {selectedRoom && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">5. Select Bed</h2>
                        {console.log("Selected Room:", selectedRoom)}

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Room <span className="font-semibold">{selectedRoom.room_number}</span> -
                                <span className="ml-2">
                                    Available beds: {
                                        roomBeds.length > 0
                                            ? roomBeds.filter(bed => bed.status === 'available').length
                                            : selectedRoom.available_beds || 0
                                    }/{selectedRoom.capacity || 4}
                                </span>
                            </p>
                        </div>

                        {/* Beds Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {roomBeds.length > 0 ? (
                                roomBeds.map((bed) => {
                                    const isSelected = selectedBed === bed.id;
                                    const isAvailable = bed.status === 'available';

                                    return (
                                        <button
                                            key={bed.id}
                                            onClick={() => isAvailable && handleBedSelection(bed.id)}
                                            disabled={!isAvailable}
                                            className={`p-4 rounded-lg border-2 transition-all ${isSelected
                                                ? 'border-green-500 bg-green-50'
                                                : !isAvailable
                                                    ? 'border-red-300 bg-red-50 cursor-not-allowed'
                                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="text-center">
                                                <div className={`text-2xl mb-1 ${!isAvailable ? 'text-red-500' : isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {!isAvailable ? '❌' : isSelected ? '✓' : '🛏️'}
                                                </div>
                                                <div className="font-medium text-sm">Bed {bed.bed_number}</div>
                                                <div className={`text-xs mt-1 ${!isAvailable ? 'text-red-600' : 'text-green-600'}`}>
                                                    {!isAvailable ? 'Occupied' : 'Available'}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                // Fallback to generated beds if no data from database
                                Array.from({ length: selectedRoom.capacity || 4 }, (_, index) => {
                                    const bedNumber = index + 1;
                                    const availableBeds = selectedRoom.available_beds || 0;
                                    const isOccupied = bedNumber > availableBeds;
                                    const isSelected = selectedBed === bedNumber;

                                    return (
                                        <button
                                            key={bedNumber}
                                            onClick={() => !isOccupied && handleBedSelection(bedNumber)}
                                            disabled={isOccupied}
                                            className={`p-4 rounded-lg border-2 transition-all ${isSelected
                                                ? 'border-green-500 bg-green-50'
                                                : isOccupied
                                                    ? 'border-red-300 bg-red-50 cursor-not-allowed'
                                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="text-center">
                                                <div className={`text-2xl mb-1 ${isOccupied ? 'text-red-500' : isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {isOccupied ? '❌' : isSelected ? '✓' : '🛏️'}
                                                </div>
                                                <div className="font-medium text-sm">Bed {bedNumber}</div>
                                                <div className={`text-xs mt-1 ${isOccupied ? 'text-red-600' : 'text-green-600'}`}>
                                                    {isOccupied ? 'Occupied' : 'Available'}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Selected Bed Info */}
                        {selectedBed && selectedBedForInfo && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-green-800">
                                            Selected: Bed {selectedBedForInfo.bedNumber} in Room {selectedBedForInfo.roomNumber}
                                        </p>
                                        <p className="text-sm text-green-600 mt-1">
                                            {selectedBedForInfo.hostelName} - {selectedHostel.gender === 'male' ? 'Boys Hostel' : 'Girls Hostel'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleConfirmBooking}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* No Bed Selected Message */}
                        {!selectedBed && (
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center">
                                    <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-yellow-700">Please select an available bed to proceed with booking.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Booking Form Modal */}
                {showBookingForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">Complete Your Booking</h2>
                                <button
                                    onClick={() => {
                                        setShowBookingForm(false);
                                        setSelectedBed(null);
                                        setSelectedBedForInfo(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Booking Summary */}
                            {selectedBedForInfo && (
                                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Hostel</p>
                                            <p className="font-medium">{selectedBedForInfo.hostelName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Room</p>
                                            <p className="font-medium">{selectedBedForInfo.roomNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Bed</p>
                                            <p className="font-medium">{selectedBedForInfo.bedNumber}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Booking Form */}
                            <form onSubmit={handleBookingSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Student Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={studentName}
                                            onChange={(e) => setStudentName(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Admission Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={admissionNumber}
                                            onChange={(e) => setAdmissionNumber(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter admission number"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Academic Year *
                                        </label>
                                        <select
                                            value={academicYear}
                                            onChange={(e) => setAcademicYear(e.target.value)}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Academic Year</option>
                                            <option value="2024/2025">2024/2025</option>
                                            <option value="2025/2026">2025/2026</option>
                                            <option value="2026/2027">2026/2027</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount (TZS) *
                                        </label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            required
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter amount"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Control Number *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={controlNumber}
                                            onChange={(e) => setControlNumber(e.target.value)}
                                            required
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter or generate control number"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleGenerateControlNumber}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                                        >
                                            Generate
                                        </button>
                                    </div>
                                    {controlNumberGenerated && (
                                        <p className="text-xs text-green-600 mt-1">Control number generated successfully!</p>
                                    )}
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowBookingForm(false);
                                            setSelectedBed(null);
                                            setSelectedBedForInfo(null);
                                        }}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Processing...' : 'Complete Booking'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Booking Confirmation Modal */}
                {showBookingModal && bookingModalData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                            <div className="text-center mb-6">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                                <p className="text-gray-600">Your hostel booking has been successfully completed.</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Booking Details</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Student Name:</span>
                                        <span className="font-medium">{bookingModalData.studentName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Admission Number:</span>
                                        <span className="font-medium">{bookingModalData.admissionNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Hostel:</span>
                                        <span className="font-medium">{bookingModalData.hostel}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Room:</span>
                                        <span className="font-medium">{bookingModalData.room}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Bed:</span>
                                        <span className="font-medium">{bookingModalData.bed}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Control Number:</span>
                                        <span className="font-medium">{bookingModalData.controlNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount:</span>
                                        <span className="font-medium">{bookingModalData.amount} TZS</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Academic Year:</span>
                                        <span className="font-medium">{bookingModalData.academicYear}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between">
                                <button
                                    onClick={() => {
                                        setShowBookingModal(false);
                                        setBookingModalData(null);
                                    }}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
