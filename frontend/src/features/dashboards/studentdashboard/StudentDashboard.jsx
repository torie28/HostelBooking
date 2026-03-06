import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { hostelApi, roomApi } from '../../../services/api';

export function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [selectedGender, setSelectedGender] = useState('');
    const [selectedHostel, setSelectedHostel] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedBed, setSelectedBed] = useState(null);
    const [selectedBedForInfo, setSelectedBedForInfo] = useState(null);
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
    const navigate = useNavigate();

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
                rooms: hostel.rooms || []
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

    const handleBedSelection = (bedNumber) => {
        setSelectedBed(bedNumber);
        setSelectedBedForInfo({
            bedNumber,
            roomNumber: selectedRoom.room_number,
            hostelName: selectedHostel.name
        });
    };

    // Booking form functions
    const generateControlNumber = () => {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setControlNumber(`CTRL${timestamp.slice(-6)}${random}`);
    };

    const handleBookingSubmit = async (e) => {
        e.preventDefault();

        if (!selectedHostel || !selectedRoom || !selectedBed || !admissionNumber || !studentName) {
            alert('Please fill in all required fields');
            return;
        }

        setIsLoading(true);

        try {
            // Here you would typically make an API call to save the booking
            const bookingData = {
                studentName,
                admissionNumber,
                hostel: selectedHostel.name,
                room: selectedRoom.room_number,
                bed: selectedBed,
                controlNumber,
                status: 'booked', // Initial status is 'booked'
                timestamp: new Date().toISOString()
            };

            console.log('Booking data:', bookingData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Set modal data and show modal
            setBookingModalData(bookingData);
            setShowBookingModal(true);

            // Save booking to student state and localStorage
            setStudentBooking(bookingData);
            localStorage.setItem('studentBooking', JSON.stringify(bookingData));

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
        // Show booking form
        setShowBookingForm(true);
    };

    const handleGenerateControlNumber = () => {
        generateControlNumber();
        setControlNumberGenerated(true);
    };

    const handlePayment = () => {
        if (!studentBooking) return;

        // Update the booking status to 'paid'
        const updatedBooking = {
            ...studentBooking,
            status: 'paid',
            paymentTimestamp: new Date().toISOString()
        };

        // Update state and localStorage
        setStudentBooking(updatedBooking);
        localStorage.setItem('studentBooking', JSON.stringify(updatedBooking));

        // Show success message
        alert('Payment successful! Your booking is now confirmed.');
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
                                                onClick={handlePayment}
                                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-full transition-colors"
                                            >
                                                Pay Now
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
                                                setSelectedHostel(hostel);
                                                setSelectedRoom(null);
                                                setSelectedBed(null);
                                            }}
                                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedHostel?.id === hostel.id
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                                }`}
                                        >
                                            <h3 className="font-semibold text-lg">{hostel.name}</h3>
                                            <div className="text-sm text-gray-600 mt-2">
                                                <p>Total Capacity: {hostel.totalCapacity} students</p>
                                                <p>Available Rooms: {hostel.availableRooms}</p>
                                                <p>Gender: {hostel.gender === 'male' ? 'Boys' : 'Girls'}</p>
                                            </div>
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                    }
                                                }}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedRoom?.id === room.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : room.status === 'available'
                                                        ? 'border-gray-300 hover:border-gray-400'
                                                        : room.status === 'full'
                                                            ? 'border-red-300 bg-red-50 cursor-not-allowed'
                                                            : 'border-red-300 bg-red-50 cursor-not-allowed'
                                                    }`}
                                            >
                                                <h3 className="font-semibold">Room {room.room_number}</h3>
                                                <div className="text-sm mt-2">
                                                    <p className={`font-medium ${room.status === 'available' ? 'text-green-600' : room.status === 'full' ? 'text-red-600' : 'text-red-600'}`}>
                                                        Status: {room.status === 'available' ? 'Available' : room.status === 'full' ? 'Full' : 'Occupied'}
                                                    </p>
                                                    <p className="text-gray-600">Available Beds: {room.available_beds || 0}/{room.total_beds || 4}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-8">
                                            <p className="text-gray-500">No rooms found matching "{roomSearchTerm}"</p>
                                            <button
                                                onClick={() => setRoomSearchTerm('')}
                                                className="mt-2 text-blue-600 hover:text-blue-800 underline"
                                            >
                                                Clear search
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            /* All Rooms View */
                            <div className="all-rooms-view">
                                {/* Search Filter for All Rooms */}
                                <div className="mb-6">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Search all rooms by number (e.g., 101, 102)..."
                                            value={roomSearchTerm}
                                            onChange={(e) => {
                                                setRoomSearchTerm(e.target.value);
                                                setSelectedRoom(null);
                                                setSelectedBed(null);
                                            }}
                                            className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                            Found {allFilteredRooms.length} room{allFilteredRooms.length !== 1 ? 's' : ''} matching "{roomSearchTerm}"
                                        </p>
                                    )}
                                </div>

                                {/* All Rooms Table */}
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Room Number
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Hostel
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Available Beds
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Total Beds
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {allFilteredRooms.length > 0 ? (
                                                allFilteredRooms.map((room) => (
                                                    <tr key={room.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {room.room_number}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {room.hostelName}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${room.status === 'available'
                                                                ? 'bg-green-100 text-green-800'
                                                                : room.status === 'full'
                                                                    ? 'bg-red-100 text-red-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {room.status === 'available' ? 'Available' : room.status === 'full' ? 'Full' : 'Occupied'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            {room.available_beds}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            4
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                            <button
                                                                onClick={() => {
                                                                    if (room.status === 'available' || room.status === 'full') {
                                                                        setSelectedRoom(room);
                                                                        setSelectedHostel(hostels.find(h => h.id === room.hostelId));
                                                                        setSelectedBed(null);
                                                                        // Scroll to bed selection section
                                                                        setTimeout(() => {
                                                                            const bedSection = document.getElementById('bed-selection-section');
                                                                            if (bedSection) {
                                                                                bedSection.scrollIntoView({ behavior: 'smooth' });
                                                                            }
                                                                        }, 100);
                                                                    }
                                                                }}
                                                                disabled={room.status !== 'available' && room.status !== 'full'}
                                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${room.status === 'available'
                                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                    : room.status === 'full'
                                                                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                            >
                                                                {room.status === 'available' ? 'View Available Beds' : room.status === 'full' ? 'View Bed Info' : 'Occupied'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-8 text-center">
                                                        <p className="text-gray-500">No rooms found matching "{roomSearchTerm}"</p>
                                                        <button
                                                            onClick={() => setRoomSearchTerm('')}
                                                            className="mt-2 text-blue-600 hover:text-blue-800 underline"
                                                        >
                                                            Clear search
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Summary Statistics */}
                                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-blue-800">Total Rooms</h3>
                                        <p className="text-2xl font-bold text-blue-900">{getAllRooms().length}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-green-800">Available Rooms</h3>
                                        <p className="text-2xl font-bold text-green-900">
                                            {getAllRooms().filter(room => room.status === 'available').length}
                                        </p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-orange-800">Full Rooms</h3>
                                        <p className="text-2xl font-bold text-orange-900">
                                            {getAllRooms().filter(room => room.status === 'full').length}
                                        </p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-medium text-red-800">Occupied Rooms</h3>
                                        <p className="text-2xl font-bold text-red-900">
                                            {getAllRooms().filter(room => room.status === 'occupied').length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 5: Bed Selection */}
                {selectedRoom && (selectedRoom.status === 'available' || selectedRoom.status === 'full') && (
                    <div id="bed-selection-section" className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">5. Bed Information</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-gray-600 mb-4">Room {selectedRoom.room_number} - Bed Status:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {selectedRoom.beds && selectedRoom.beds.map((bed) => {
                                    const isBedAvailable = bed.status === 'available';
                                    const bookingInfo = bed.active_booking && bed.active_booking[0];
                                    return (
                                        <button
                                            key={bed.id}
                                            onClick={() => isBedAvailable && handleBedSelection(bed.bed_number)}
                                            disabled={!isBedAvailable}
                                            className={`p-4 rounded-lg border-2 transition-all ${selectedBed === bed.bed_number
                                                ? 'border-green-500 bg-green-50'
                                                : isBedAvailable
                                                    ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                                    : 'border-red-300 bg-red-50 cursor-not-allowed'
                                                }`}
                                        >
                                            <div className="text-center">
                                                <div className="text-2xl mb-2">🛏️</div>
                                                <div className="font-medium">Bed {bed.bed_number}</div>
                                                <div className={`text-sm ${isBedAvailable ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {isBedAvailable ? 'Available' :
                                                        bookingInfo ? `Booked by ${bookingInfo.student?.name || 'Student'}` : 'Occupied'}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            {selectedRoom.status === 'full' && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-700 text-sm">This room is currently full (4/4 beds occupied). No beds available for booking.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Booking Summary */}
                {selectedBed && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 max-w-md w-full mx-4">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
                                <h2 className="text-xl font-bold text-center">Booking Confirmation</h2>
                            </div>
                            <div className="p-6">
                                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-600 font-medium"> Student:</span>
                                            <span className="font-semibold text-gray-900">{user?.name || user?.email || 'Student'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-600 font-medium"> Hostel:</span>
                                            <span className="font-semibold text-gray-900">{selectedHostel.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-600 font-medium"> Room:</span>
                                            <span className="font-semibold text-gray-900">{selectedRoom.room_number}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-600 font-medium">Bed:</span>
                                            <span className="font-semibold text-gray-900">{selectedBed}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setSelectedBed(null)}
                                        className="flex-1 px-4 py-2 bg-black/60 hover:bg-black/60 text-white rounded-full font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setShowBookingForm(true)}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full font-semibold transition-all transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                                    >
                                        Proceed to Booking
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Form Modal */}
                {showBookingForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold">Complete Your Booking</h2>
                                    <button
                                        onClick={() => setShowBookingForm(false)}
                                        className="text-white hover:text-gray-200 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
                                {/* Selected Booking Info */}
                                <div className="bg-white  p-4">
                                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6 text-center">Selected Accommodation:</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-black font-medium">Hostel:</span>
                                            <span className="ml-2 text-black">{selectedHostel?.name}</span>
                                        </div>
                                        <div>
                                            <span className="text-black font-medium">Room:</span>
                                            <span className="ml-2 text-black">{selectedRoom?.room_number}</span>
                                        </div>
                                        <div>
                                            <span className="text-black font-medium">Bed:</span>
                                            <span className="ml-2 text-black">{selectedBed}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Student Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Student Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={studentName}
                                            onChange={(e) => setStudentName(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:border-blue-500"
                                            placeholder="Enter your full name"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Admission Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={admissionNumber}
                                            onChange={(e) => setAdmissionNumber(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:border-blue-500"
                                            placeholder="Enter your admission number"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Control Number Display */}
                                {controlNumberGenerated && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Your Control Number
                                        </label>
                                        <div className="bg-white border border-yellow-300 rounded-lg px-4 py-3">
                                            <p className="text-lg font-mono font-bold text-yellow-800">{controlNumber}</p>
                                        </div>
                                        <p className="text-xs text-yellow-700 mt-2">Please save this control number for future reference</p>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowBookingForm(false)}
                                        className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    {!controlNumberGenerated ? (
                                        <button
                                            type="button"
                                            onClick={handleGenerateControlNumber}
                                            className="flex-1 px-6 py-3 rounded-full font-semibold text-white transition-all bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                        >
                                            Generate Control Number
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className={`flex-1 px-6 py-3 rounded-full font-semibold text-white transition-all ${isLoading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                                                }`}
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l-1.586 1.414L12 15.414l7.586-1.414L20 12a8 8 0 01-8z"></path>
                                                    </svg>
                                                    Processing...
                                                </span>
                                            ) : (
                                                'Complete Booking'
                                            )}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Booking Success Modal */}
                {showBookingModal && bookingModalData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Successful!</h3>
                                <p className="text-gray-600 mb-6">Your hostel booking has been confirmed.</p>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-blue-800 mb-2">
                                        <strong>Control Number:</strong>
                                    </p>
                                    <p className="text-lg font-mono font-bold text-blue-900">
                                        {bookingModalData.controlNumber}
                                    </p>
                                </div>

                                <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                                    <h4 className="font-semibold text-gray-800 mb-2">Booking Details:</h4>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <p><strong>Student:</strong> {bookingModalData.studentName}</p>
                                        <p><strong>Admission:</strong> {bookingModalData.admissionNumber}</p>
                                        <p><strong>Hostel:</strong> {bookingModalData.hostel}</p>
                                        <p><strong>Room:</strong> {bookingModalData.room}</p>
                                        <p><strong>Bed:</strong> {bookingModalData.bed}</p>
                                    </div>
                                </div>

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