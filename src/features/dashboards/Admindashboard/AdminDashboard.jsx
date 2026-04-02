import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import { hostelApi, roomApi, genderApi, bookingApi } from '../../../services/api';

import { handleEditRoom, handleUpdateRoom, handleDeleteRoom } from './roomFunctions';



export function AdminDashboard() {

    const [user, setUser] = useState(null);

    const [activeTab, setActiveTab] = useState('overview');

    const [hostels, setHostels] = useState([]);

    const [rooms, setRooms] = useState([]);

    const [beds, setBeds] = useState([]);

    const [students, setStudents] = useState([]);

    const [genders, setGenders] = useState([]);

    const [loading, setLoading] = useState(true);

    const [showAddHostelModal, setShowAddHostelModal] = useState(false);

    const [showAddRoomModal, setShowAddRoomModal] = useState(false);

    const [showEditRoomModal, setShowEditRoomModal] = useState(false);

    const [showEditHostelModal, setShowEditHostelModal] = useState(false);

    const [showAddBedModal, setShowAddBedModal] = useState(false);

    const [showEditBedModal, setShowEditBedModal] = useState(false);

    const [editingBed, setEditingBed] = useState(null);

    const [editingRoom, setEditingRoom] = useState(null);

    const [editingHostel, setEditingHostel] = useState(null);

    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const navigate = useNavigate();



    // Form states

    const [newHostel, setNewHostel] = useState({ name: '', gender: '', capacity: '' });

    const [newRoom, setNewRoom] = useState({ hostel_id: '', room_number: '', floor_number: '', capacity: 4, status: 'available' });

    const [newBed, setNewBed] = useState({ room_id: '', bed_number: '', status: 'available' });

    const [editingBedData, setEditingBedData] = useState({ bed_number: '', room_id: '', status: 'available' });



    // Beds tab selection states

    const [selectedGender, setSelectedGender] = useState('');

    const [selectedHostel, setSelectedHostel] = useState('');

    const [selectedRoom, setSelectedRoom] = useState('');



    useEffect(() => {

        const userData = localStorage.getItem('user');

        if (userData) {

            try {

                const parsedUser = JSON.parse(userData);

                setUser(parsedUser);

            } catch (error) {

                console.error('Error parsing user data:', error);

                navigate('/');

            }

        } else {

            navigate('/');

        }

        fetchData();

    }, [navigate]);



    const fetchData = async () => {

        try {

            setLoading(true);

            // Fetch hostels from database

            const hostelsData = await hostelApi.getAll();

            setHostels(hostelsData);



            // Fetch genders from database

            const gendersData = await genderApi.getAll();

            setGenders(gendersData);



            // Extract rooms and beds from hostel data

            const allRooms = [];

            const allBeds = [];



            hostelsData.forEach(hostel => {

                if (hostel.rooms) {

                    hostel.rooms.forEach(room => {

                        // Determine room status - prioritize database status, then calculate based on bed availability

                        let roomStatus = room.status || 'available';



                        // Only calculate status if no explicit status is set in database

                        if (!room.status) {

                            const occupiedBeds = room.beds ? room.beds.filter(bed => bed.status === 'occupied' || bed.status === 'taken').length : 0;

                            const totalBeds = room.total_beds || 0;



                            if (occupiedBeds === 0) {

                                roomStatus = 'available';

                            } else if (occupiedBeds >= totalBeds) {

                                roomStatus = 'full';

                            } else {

                                roomStatus = 'partially_occupied';

                            }

                        }



                        allRooms.push({

                            id: room.id,

                            hostel_id: room.hostel_id,

                            room_number: room.room_number,

                            floor_number: room.floor_number,

                            capacity: room.total_beds || 0,

                            available_beds: (room.total_beds || 0) - (room.beds ? room.beds.filter(bed => bed.status === 'occupied' || bed.status === 'taken').length : 0),

                            status: roomStatus

                        });



                        if (room.beds) {

                            room.beds.forEach(bed => {

                                allBeds.push({

                                    id: bed.id,

                                    room_id: room.id,

                                    bed_number: bed.bed_number,

                                    status: bed.status,

                                    student_name: bed.status === 'occupied' ? 'Student' : null

                                });

                            });

                        }

                    });

                }

            });



            setRooms(allRooms);

            setBeds(allBeds);



            // Fetch students from hostel bookings table

            const bookingsData = await bookingApi.getAll();



            // Transform booking data to match the expected student format

            const studentsData = bookingsData.map(booking => ({

                id: booking.id,

                name: booking.student_name || booking.student?.name || 'Unknown',

                email: booking.student?.email || '',

                level: booking.student?.level || booking.student?.level?.name || 'Unknown',

                hostel: booking.bed?.room?.hostel?.name || 'Unknown',

                room: booking.room_number || booking.bed?.room?.room_number || 'Unknown',

                bed: booking.bed?.bed_number || 'Unknown',

                admission_number: booking.admission_number,

                academic_year: booking.academic_year,

                amount: booking.amount,

                status: booking.status,

                booking_date: booking.booking_date,

                control_number: booking.controlnumber

            }));



            setStudents(studentsData);

        } catch (error) {

            console.error('Error fetching data:', error);

        } finally {

            setLoading(false);

        }

    };



    const showNotification = (message, type = 'success') => {

        setNotification({ show: true, message, type });

        setTimeout(() => {

            setNotification({ show: false, message: '', type: 'success' });

        }, 3000);

    };



    const handleEditHostel = (hostel) => {

        setEditingHostel(hostel);

        setNewHostel({

            name: hostel.name,

            gender: hostel.gender,

            capacity: hostel.capacity,

            status: hostel.status || 'active'

        });

        setShowEditHostelModal(true);

    };



    const handleUpdateHostel = async (e) => {

        e.preventDefault();

        try {

            const response = await hostelApi.update(editingHostel.id, {

                name: newHostel.name,

                gender: newHostel.gender,

                capacity: parseInt(newHostel.capacity),

                status: newHostel.status || 'active'

            });



            if (response) {

                await fetchData();

                setNewHostel({ name: '', gender: '', capacity: '', status: '' });

                setShowEditHostelModal(false);

                setEditingHostel(null);

                showNotification('Hostel updated successfully!', 'success');

            }

        } catch (error) {

            console.error('Error updating hostel:', error);

            showNotification('Error updating hostel', 'error');

        }

    };



    const handleDeleteHostel = async (hostelId) => {

        if (window.confirm('Are you sure you want to delete this hostel? This action cannot be undone.')) {

            try {

                await hostelApi.delete(hostelId);

                await fetchData();

            } catch (error) {

                console.error('Error deleting hostel:', error);

            }

        }

    };



    const handleAddHostel = async (e) => {

        e.preventDefault();

        try {

            // API call to add hostel

            const response = await fetch('http://localhost:8000/api/hostels', {

                method: 'POST',

                headers: {

                    'Content-Type': 'application/json',

                    'Accept': 'application/json',

                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`

                },

                body: JSON.stringify({

                    name: newHostel.name,

                    gender: newHostel.gender,

                    capacity: parseInt(newHostel.capacity),

                    status: 'active'

                })

            });



            if (response.ok) {

                // Refresh data to get updated list

                await fetchData();

                setNewHostel({ name: '', gender: '', capacity: '' });

                setShowAddHostelModal(false);

            } else {

                const errorData = await response.json();

                console.error('Error adding hostel:', errorData);

            }

        } catch (error) {

            console.error('Error adding hostel:', error);

        }

    };



    const handleAddRoom = async (e) => {

        e.preventDefault();

        try {

            // API call to add room

            const response = await roomApi.create({

                hostel_id: parseInt(newRoom.hostel_id),

                floor_number: parseInt(newRoom.floor_number),

                room_number: newRoom.room_number,

                total_beds: parseInt(newRoom.capacity),

                status: 'available'

            });



            if (response.success) {

                // Refresh data to get updated list

                await fetchData();

                setNewRoom({ hostel_id: '', room_number: '', floor_number: '', capacity: 4, status: 'available' });

                setShowAddRoomModal(false);

            } else {

                console.error('Error adding room:', response.message);

            }

        } catch (error) {

            console.error('Error adding room:', error);

        }

    };



    const handleAddBed = async (e) => {

        e.preventDefault();

        try {

            console.log('Adding bed:', newBed);

            setBeds([...beds, { ...newBed, id: Date.now() }]);

            setNewBed({ room_id: '', bed_number: '', status: 'available' });

            setShowAddBedModal(false);

        } catch (error) {

            console.error('Error adding bed:', error);

        }

    };



    const exportToExcel = () => {

        const headers = ['Name', 'Email', 'Level', 'Academic Year', 'Amount', 'Hostel', 'Room', 'Bed'];

        const csvContent = [

            headers.join(','),

            ...students.map(student =>

                [student.name, student.email, student.level, student.academic_year || '', student.amount || '', student.hostel, student.room, student.bed]

                    .map(field => `"${field}"`)

                    .join(',')

            )

        ].join('\n');



        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        const link = document.createElement('a');

        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);

        link.setAttribute('download', `student_accommodation_${new Date().toISOString().split('T')[0]}.csv`);

        link.style.visibility = 'hidden';

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

    };



    const clearStudentData = () => {

        if (window.confirm('Are you sure you want to clear all student booking data? This action cannot be undone and will remove all student hostel assignments.')) {

            setStudents([]);

            showNotification('All student booking data has been cleared successfully!', 'success');

        }

    };



    const exportToPDF = () => {
        // Store current page content
        const originalContent = document.body.innerHTML;

        // Create the print content
        const printContent = `

            <html>

                <head>

                    <title>Student Accommodation Report</title>

                    <style>

                        @page {
                            margin: 1.5cm;
                            size: A4;
                        }

                        

                        body { 

                            font-family: 'Times New Roman', Times, serif; 

                            margin: 0; 

                            padding: 20px; 

                            line-height: 1.6;

                            color: #2c3e50;

                            background: #ffffff;

                        }

                        

                        .header {

                            text-align: center;

                            margin-bottom: 40px;

                            padding-bottom: 20px;

                            border-bottom: 3px solid #2c3e50;

                        }

                        

                        .header h1 {

                            font-size: 28px;

                            font-weight: bold;

                            color: #2c3e50;

                            margin: 0 0 10px 0;

                            text-transform: uppercase;

                            letter-spacing: 2px;

                        }

                        

                        .header .subtitle {

                            font-size: 14px;

                            color: #7f8c8d;

                            font-style: italic;

                            margin: 5px 0;

                        }

                        

                        .report-info {

                            text-align: center;

                            margin-bottom: 30px;

                        }

                        

                        .report-info p {

                            font-size: 12px;

                            color: #7f8c8d;

                            margin: 5px 0;

                        }

                        

                        table { 

                            border-collapse: collapse; 

                            width: 100%; 

                            margin-bottom: 20px; 

                            border: 2px solid #2c3e50;

                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);

                        }

                        

                        th, td { 

                            border: 1px solid #34495e; 

                            padding: 6px 3px; 

                            text-align: left; 

                            font-size: 9px; 

                        }

                        

                        th { 

                            background: linear-gradient(to bottom, #34495e, #2c3e50); 

                            color: white; 

                            font-weight: bold; 

                            text-transform: uppercase;

                            font-size: 8px; 

                            letter-spacing: 0.3px;

                            text-align: center;

                        }

                        

                        tbody tr:nth-child(even) {

                            background-color: #f8f9fa;

                        }

                        

                        tbody tr:hover {

                            background-color: #e8f4f8;

                        }

                        

                        .footer {

                            margin-top: 40px;

                            padding-top: 20px;

                            border-top: 1px solid #bdc3c7;

                            text-align: center;

                            font-size: 10px;

                            color: #7f8c8d;

                        }

                        

                        .watermark {

                            position: fixed;

                            top: 50%;

                            left: 50%;

                            transform: translate(-50%, -50%) rotate(-45deg);

                            font-size: 100px;

                            color: #ecf0f1;

                            z-index: -1;

                            opacity: 0.3;

                            font-weight: bold;

                        }

                        

                        @media print {

                            .watermark {

                                position: fixed;

                                top: 50%;

                                left: 50%;

                                transform: translate(-50%, -50%) rotate(-45deg);

                                font-size: 80px;

                                color: #ecf0f1;

                                z-index: -1;

                                opacity: 0.2;

                            }

                        }

                    </style>

                </head>

                <body>

                    <div class="watermark">OFFICIAL</div>

                    <div class="header">

                        <h1>Student Accommodation Report</h1>

                        <div class="subtitle">Hostel Management System</div>

                        <div class="subtitle">Academic Year ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</div>

                    </div>

                    <div class="report-info">

                        <p><strong>Report Generated:</strong> ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

                        <p><strong>Total Students:</strong> ${students.length}</p>

                        <p><strong>Generated By:</strong> ${user ? user.name : 'Administrator'}</p>

                    </div>

                    <table>

                        <thead>

                            <tr>

                                <th>S.No</th>

                                <th>Student Name</th>

                                <th>Email Address</th>

                                <th>Academic Level</th>

                                <th>Academic Year</th>

                                <th>Amount</th>

                                <th>Hostel Name</th>

                                <th>Room Number</th>

                                <th>Bed Number</th>

                            </tr>

                        </thead>

                        <tbody>

                            ${students.map((student, index) => `

                                <tr>

                                    <td style="text-align: center; font-weight: bold;">${index + 1}</td>

                                    <td style="font-weight: 600;">${student.name}</td>

                                    <td>${student.email}</td>

                                    <td style="text-align: center;">${student.level}</td>

                                    <td style="text-align: center;">${student.academic_year || '-'}</td>

                                    <td style="text-align: center;">${student.amount ? `$${student.amount}` : '-'}</td>

                                    <td>${student.hostel}</td>

                                    <td style="text-align: center; font-weight: 600;">${student.room}</td>

                                    <td style="text-align: center;">${student.bed}</td>

                                </tr>

                            `).join('')}

                        </tbody>

                    </table>

                    <div class="footer">

                        <p> ${new Date().getFullYear()} Hostel Management System | Confidential Document</p>

                        <p>This document contains sensitive information and should be handled according to institutional policies.</p>

                    </div>

                </body>

            </html>

        `;

        // Replace current content with print content
        document.body.innerHTML = printContent;

        // Print the current page
        window.print();

        // Restore original content after printing (with a small delay to ensure print dialog starts)
        setTimeout(() => {
            document.body.innerHTML = originalContent;
            // Re-attach any event listeners that might have been lost
            window.location.reload();
        }, 100);
    };


    const handleLogout = () => {

        localStorage.removeItem('auth_token');

        localStorage.removeItem('user');

        navigate('/');

    };



    const handleEditBed = (bed) => {

        setEditingBed(bed);

        setEditingBedData({

            bed_number: bed.bed_number,

            room_id: bed.room_id,

            status: bed.status

        });

        setShowEditBedModal(true);

    };



    const handleUpdateBed = async (e) => {

        e.preventDefault();

        try {

            const response = await roomApi.updateBed(editingBed.id, {

                bed_number: editingBedData.bed_number,

                room_id: editingBedData.room_id,

                status: editingBedData.status

            });



            if (response.success) {

                await fetchData();

                setEditingBedData({ bed_number: '', room_id: '', status: 'available' });

                setShowEditBedModal(false);

                setEditingBed(null);

                showNotification('Bed updated successfully!', 'success');

            } else {

                showNotification(response.message || 'Error updating bed', 'error');

            }

        } catch (error) {

            console.error('Error updating bed:', error);

            showNotification('Error updating bed', 'error');

        }

    };



    const handleDeleteBed = async (bedId) => {

        if (window.confirm('Are you sure you want to delete this bed? This action cannot be undone.')) {

            try {

                await roomApi.deleteBed(bedId);

                await fetchData();

                showNotification('Bed deleted successfully!', 'success');

            } catch (error) {

                console.error('Error deleting bed:', error);

                showNotification('Error deleting bed', 'error');

            }

        }

    };



    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center">

                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>

            </div>

        );

    }



    return (

        <div className="min-h-screen bg-gray-100">

            {/* Notification */}

            {notification.show && (

                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">

                    <div className={`px-6 py-3 rounded-lg shadow-lg text-white font-medium ${notification.type === 'success'

                        ? 'bg-green-500'

                        : 'bg-red-500'

                        }`}>

                        {notification.message}

                    </div>

                </div>

            )}

            {/* Classic Header */}

            <header className="bg-slate-800 border-b-2 border-slate-700 shadow-lg">

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="flex justify-between items-center h-20">

                        {/* Left Section - Title and Welcome */}

                        <div className="flex items-center space-x-6">

                            <div className="border-r border-slate-600 pr-6">

                                <h1 className="text-2xl font-serif font-bold text-white tracking-wide">

                                    Administration Portal

                                </h1>

                                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Hostel Management System</p>

                            </div>

                            {user && (

                                <div className="flex flex-col">

                                    <span className="text-sm font-medium text-slate-200">Welcome back,</span>

                                    <span className="text-lg font-semibold text-white">{user.name}</span>

                                </div>

                            )}

                        </div>



                        {/* Right Section - Actions */}

                        <div className="flex items-center space-x-4">

                            <div className="text-right mr-6">

                                <p className="text-xs text-slate-400 uppercase tracking-wider">System Time</p>

                                <p className="text-sm font-medium text-slate-200">{new Date().toLocaleString()}</p>

                            </div>

                            <button

                                onClick={handleLogout}

                                className="flex items-center px-6 py-3 bg-slate-900 hover:bg-slate-700 text-white font-medium rounded-full border border-slate-600 transition-all duration-200 shadow-md hover:shadow-lg"

                            >

                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />

                                </svg>

                                Sign Out

                            </button>

                        </div>

                    </div>

                </div>

            </header>



            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

                {/* Tab Navigation */}

                <div className="bg-white rounded-lg shadow mb-6">

                    <div className="border-b border-gray-200">

                        <nav className="-mb-px flex space-x-8">

                            {['overview', 'hostels', 'rooms', 'beds', 'students'].map((tab) => (

                                <button

                                    key={tab}

                                    onClick={() => setActiveTab(tab)}

                                    className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab

                                        ? 'border-blue-500 text-blue-600'

                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'

                                        }`}

                                >

                                    {tab}

                                </button>

                            ))}

                        </nav>

                    </div>

                </div>



                {/* Overview Tab */}

                {activeTab === 'overview' && (

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        <div className="bg-white overflow-hidden shadow rounded-lg">

                            <div className="p-5">

                                <div className="flex items-center">

                                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">

                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />

                                        </svg>

                                    </div>

                                    <div className="ml-5 w-0 flex-1">

                                        <dl>

                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Hostels</dt>

                                            <dd className="text-lg font-medium text-gray-900">{hostels.length}</dd>

                                        </dl>

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">

                            <div className="p-5">

                                <div className="flex items-center">

                                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">

                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1 1v3a1 1 0 001 1h3m-6 0h6" />

                                        </svg>

                                    </div>

                                    <div className="ml-5 w-0 flex-1">

                                        <dl>

                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Rooms</dt>

                                            <dd className="text-lg font-medium text-gray-900">{rooms.length}</dd>

                                        </dl>

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">

                            <div className="p-5">

                                <div className="flex items-center">

                                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">

                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2m8 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />

                                        </svg>

                                    </div>

                                    <div className="ml-5 w-0 flex-1">

                                        <dl>

                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Beds</dt>

                                            <dd className="text-lg font-medium text-gray-900">{beds.length}</dd>

                                        </dl>

                                    </div>

                                </div>

                            </div>

                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">

                            <div className="p-5">

                                <div className="flex items-center">

                                    <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">

                                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />

                                        </svg>

                                    </div>

                                    <div className="ml-5 w-0 flex-1">

                                        <dl>

                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>

                                            <dd className="text-lg font-medium text-gray-900">{students.length}</dd>

                                        </dl>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                )}



                {/* Hostels Tab */}

                {activeTab === 'hostels' && (

                    <div className="bg-white shadow rounded-lg">

                        <div className="px-4 py-5 sm:p-6">

                            <div className="flex justify-between items-center mb-4">

                                <h3 className="text-lg leading-6 font-medium text-gray-900">Hostels</h3>

                                <button

                                    onClick={() => setShowAddHostelModal(true)}

                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"

                                >

                                    Add Hostel

                                </button>

                            </div>

                            <div className="overflow-x-auto">

                                <table className="min-w-full divide-y divide-gray-200">

                                    <thead className="bg-gray-50">

                                        <tr>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>

                                        </tr>

                                    </thead>

                                    <tbody className="bg-white divide-y divide-gray-200">

                                        {hostels.map((hostel) => (

                                            <tr key={hostel.id}>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hostel.name}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hostel.gender}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hostel.capacity}</td>

                                                <td className="px-6 py-4 whitespace-nowrap">

                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${hostel.status === 'active'

                                                        ? 'bg-green-100 text-green-800'

                                                        : hostel.status === 'inactive'

                                                            ? 'bg-red-100 text-red-800'

                                                            : 'bg-yellow-100 text-yellow-800'

                                                        }`}>

                                                        {hostel.status || 'active'}

                                                    </span>

                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                                                    <button

                                                        onClick={() => handleEditHostel(hostel)}

                                                        className="text-blue-600 hover:text-blue-900 mr-3"

                                                    >

                                                        Edit

                                                    </button>

                                                    <button

                                                        onClick={() => handleDeleteHostel(hostel.id)}

                                                        className="text-red-600 hover:text-red-900"

                                                    >

                                                        Delete

                                                    </button>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </div>

                )}



                {/* Rooms Tab */}

                {activeTab === 'rooms' && (

                    <div className="bg-white shadow rounded-lg">

                        <div className="px-4 py-5 sm:p-6">

                            <div className="flex justify-between items-center mb-4">

                                <h3 className="text-lg leading-6 font-medium text-gray-900">Rooms</h3>

                                <button

                                    onClick={() => setShowAddRoomModal(true)}

                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"

                                >

                                    Add Room

                                </button>

                            </div>

                            <div className="overflow-x-auto">

                                <table className="min-w-full divide-y divide-gray-200">

                                    <thead className="bg-gray-50">

                                        <tr>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Number</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hostel</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Beds</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>

                                        </tr>

                                    </thead>

                                    <tbody className="bg-white divide-y divide-gray-200">

                                        {rooms.map((room) => (

                                            <tr key={room.id}>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{room.room_number}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.floor_number}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hostels.find(h => h.id === room.hostel_id)?.name}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room.capacity}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                                                    {room.available_beds === 0 ? 'all taken' : room.available_beds}

                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap">

                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${room.status === 'available'

                                                        ? 'bg-green-100 text-green-800'

                                                        : room.status === 'full'

                                                            ? 'bg-red-100 text-red-800'

                                                            : 'bg-yellow-100 text-yellow-800'

                                                        }`}>

                                                        {room.status === 'partially_occupied' ? 'Partially Occupied' : room.status.charAt(0).toUpperCase() + room.status.slice(1)}

                                                    </span>

                                                </td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                                                    <button

                                                        onClick={() => handleEditRoom(room, setEditingRoom, setNewRoom, setShowEditRoomModal)}

                                                        className="text-blue-600 hover:text-blue-900 mr-3"

                                                    >

                                                        Edit

                                                    </button>

                                                    <button

                                                        onClick={() => handleDeleteRoom(room.id, fetchData)}

                                                        className="text-red-600 hover:text-red-900"

                                                    >

                                                        Delete

                                                    </button>

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </div>

                )}



                {/* Beds Tab */}

                {activeTab === 'beds' && (

                    <div className="bg-white shadow rounded-lg">

                        <div className="px-4 py-5 sm:p-6">

                            <div className="flex justify-between items-center mb-6">

                                <h3 className="text-lg leading-6 font-medium text-gray-900">Beds Management</h3>

                                <button

                                    onClick={() => setShowAddBedModal(true)}

                                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-black/10  focus:outline-none "

                                    disabled={!selectedRoom}

                                >

                                    Add Bed

                                </button>

                            </div>



                            {/* Selection Interface */}

                            <div className="bg-gray-50 rounded-lg p-6 mb-6">

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    {/* Gender Selection */}

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 mb-2">

                                            Select Gender

                                        </label>

                                        <select

                                            value={selectedGender}

                                            onChange={(e) => {

                                                setSelectedGender(e.target.value);

                                                setSelectedHostel('');

                                                setSelectedRoom('');

                                            }}

                                            className="w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"

                                        >

                                            <option value="">Choose Gender...</option>

                                            {genders.map((gender) => (

                                                <option key={gender.value} value={gender.value}>

                                                    {gender.label}

                                                </option>

                                            ))}

                                        </select>

                                    </div>



                                    {/* Hostel Selection */}

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 mb-2">

                                            Select Hostel

                                        </label>

                                        <select

                                            value={selectedHostel}

                                            onChange={(e) => {

                                                setSelectedHostel(e.target.value);

                                                setSelectedRoom('');

                                            }}

                                            disabled={!selectedGender}

                                            className="w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"

                                        >

                                            <option value="">Choose Hostel...</option>

                                            {hostels

                                                .filter(hostel => hostel.gender === selectedGender)

                                                .map((hostel) => (

                                                    <option key={hostel.id} value={hostel.id}>

                                                        {hostel.name}

                                                    </option>

                                                ))}

                                        </select>

                                    </div>



                                    {/* Room Selection */}

                                    <div>

                                        <label className="block text-sm font-medium text-gray-700 mb-2">

                                            Select Room

                                        </label>

                                        <select

                                            value={selectedRoom}

                                            onChange={(e) => setSelectedRoom(e.target.value)}

                                            disabled={!selectedHostel}

                                            className="w-full px-3 py-2 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"

                                        >

                                            <option value="">Choose Room...</option>

                                            {rooms

                                                .filter(room => room.hostel_id == selectedHostel)

                                                .map((room) => (

                                                    <option key={room.id} value={room.id}>

                                                        Room {room.room_number} (Floor {room.floor_number})

                                                    </option>

                                                ))}

                                        </select>

                                    </div>

                                </div>



                                {/* Reset Button */}

                                {(selectedGender || selectedHostel || selectedRoom) && (

                                    <div className="mt-4">

                                        <button

                                            onClick={() => {

                                                setSelectedGender('');

                                                setSelectedHostel('');

                                                setSelectedRoom('');

                                            }}

                                            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-black/10  focus:outline-none "

                                        >

                                            Reset Selection

                                        </button>

                                    </div>

                                )}

                            </div>



                            {/* Beds Display */}

                            {selectedRoom ? (

                                <div>

                                    <div className="mb-4">

                                        <h4 className="text-md font-medium text-gray-900">

                                            Room {rooms.find(r => r.id == selectedRoom)?.room_number} Beds

                                        </h4>

                                        <p className="text-sm text-gray-600">

                                            {beds.filter(bed => bed.room_id == selectedRoom).length} beds total

                                        </p>

                                    </div>

                                    <div className="overflow-x-auto">

                                        <table className="min-w-full divide-y divide-gray-200">

                                            <thead className="bg-gray-50">

                                                <tr>

                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed Number</th>

                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>

                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>

                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>

                                                </tr>

                                            </thead>

                                            <tbody className="bg-white divide-y divide-gray-200">

                                                {beds

                                                    .filter(bed => bed.room_id == selectedRoom)

                                                    .map((bed) => (

                                                        <tr key={bed.id}>

                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">

                                                                {bed.bed_number}

                                                            </td>

                                                            <td className="px-6 py-4 whitespace-nowrap">

                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${bed.status === 'available'

                                                                    ? 'bg-green-100 text-green-800'

                                                                    : 'bg-red-100 text-red-800'

                                                                    }`}>

                                                                    {bed.status}

                                                                </span>

                                                            </td>

                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                                                                {bed.student_name || '-'}

                                                            </td>

                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">

                                                                <button

                                                                    onClick={() => handleEditBed(bed)}

                                                                    className="text-blue-600 hover:text-blue-900 mr-3"

                                                                >

                                                                    Edit

                                                                </button>

                                                                <button

                                                                    onClick={() => handleDeleteBed(bed.id)}

                                                                    className="text-red-600 hover:text-red-900"

                                                                >

                                                                    Delete

                                                                </button>

                                                            </td>

                                                        </tr>

                                                    ))}

                                            </tbody>

                                        </table>

                                        {beds.filter(bed => bed.room_id == selectedRoom).length === 0 && (

                                            <div className="text-center py-8">

                                                <p className="text-gray-500">No beds found in this room.</p>

                                            </div>

                                        )}

                                    </div>

                                </div>

                            ) : (

                                <div className="text-center py-12">

                                    <div className="text-gray-400 mb-4">

                                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">

                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2m8 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />

                                        </svg>

                                    </div>

                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select Room to View Beds</h3>

                                    <p className="text-gray-500">Choose a gender, hostel, and room to view and manage beds.</p>

                                </div>

                            )}

                        </div>

                    </div>

                )}



                {/* Students Tab */}

                {activeTab === 'students' && (

                    <div className="bg-white shadow rounded-lg">

                        <div className="px-4 py-5 sm:p-6">

                            <div className="flex justify-between items-center mb-4">

                                <h3 className="text-lg leading-6 font-medium text-gray-900">Students</h3>

                                <div className="flex space-x-3">

                                    <button

                                        onClick={exportToExcel}

                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600"

                                    >

                                        Export to Excel

                                    </button>

                                    <button

                                        onClick={exportToPDF}

                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-black"

                                    >

                                        Export to PDF

                                    </button>

                                    <button

                                        onClick={clearStudentData}

                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-red-600"

                                    >

                                        Clear Data

                                    </button>

                                </div>

                            </div>

                            <div className="overflow-x-auto">

                                <table className="min-w-full divide-y divide-gray-200">

                                    <thead className="bg-gray-50">

                                        <tr>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hostel</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>

                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed</th>

                                        </tr>

                                    </thead>

                                    <tbody className="bg-white divide-y divide-gray-200">

                                        {students.map((student) => (

                                            <tr key={student.id}>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.level}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.academic_year || '-'}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.amount ? `$${student.amount}` : '-'}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.hostel}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.room}</td>

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.bed}</td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        </div>

                    </div>

                )}

            </div>



            {/* Add Hostel Modal */}

            {showAddHostelModal && (

                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

                        <div className="mt-3 text-center">

                            <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Hostel</h3>

                            <form onSubmit={handleAddHostel} className="mt-4 space-y-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Hostel Name</label>

                                    <input

                                        type="text"

                                        value={newHostel.name}

                                        onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Gender</label>

                                    <select

                                        value={newHostel.gender}

                                        onChange={(e) => setNewHostel({ ...newHostel, gender: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="">Select Gender</option>

                                        {genders.map((gender) => (

                                            <option key={gender.value} value={gender.value}>

                                                {gender.label}

                                            </option>

                                        ))}

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Capacity</label>

                                    <input

                                        type="number"

                                        value={newHostel.capacity}

                                        onChange={(e) => setNewHostel({ ...newHostel, capacity: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div className="flex justify-end space-x-3 mt-6">

                                    <button

                                        type="button"

                                        onClick={() => setShowAddHostelModal(false)}

                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"

                                    >

                                        Cancel

                                    </button>

                                    <button

                                        type="submit"

                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"

                                    >

                                        Add Hostel

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}



            {/* Add Room Modal */}

            {showAddRoomModal && (

                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

                        <div className="mt-3 text-center">

                            <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Room</h3>

                            <form onSubmit={handleAddRoom} className="mt-4 space-y-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Hostel</label>

                                    <select

                                        value={newRoom.hostel_id}

                                        onChange={(e) => setNewRoom({ ...newRoom, hostel_id: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="">Select Hostel</option>

                                        {hostels.map((hostel) => (

                                            <option key={hostel.id} value={hostel.id}>{hostel.name}</option>

                                        ))}

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Room Number</label>

                                    <input

                                        type="text"

                                        value={newRoom.room_number}

                                        onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Floor Number</label>

                                    <input

                                        type="number"

                                        value={newRoom.floor_number}

                                        onChange={(e) => setNewRoom({ ...newRoom, floor_number: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Capacity (Beds)</label>

                                    <input

                                        type="number"

                                        value={newRoom.capacity}

                                        onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Status</label>

                                    <select

                                        value={newRoom.status || 'available'}

                                        onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="available">Available</option>

                                        <option value="full">Full</option>

                                        <option value="maintenance">Maintenance</option>

                                    </select>

                                </div>

                                <div className="flex justify-end space-x-3 mt-6">

                                    <button

                                        type="button"

                                        onClick={() => setShowAddRoomModal(false)}

                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"

                                    >

                                        Cancel

                                    </button>

                                    <button

                                        type="submit"

                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"

                                    >

                                        Add Room

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}



            {/* Edit Room Modal */}

            {showEditRoomModal && (

                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

                        <div className="mt-3 text-center">

                            <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Room</h3>

                            <form onSubmit={(e) => handleUpdateRoom(e, newRoom, editingRoom, fetchData, setShowEditRoomModal, setEditingRoom, setNewRoom)} className="mt-4 space-y-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Hostel</label>

                                    <select

                                        value={newRoom.hostel_id}

                                        onChange={(e) => setNewRoom({ ...newRoom, hostel_id: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="">Select Hostel</option>

                                        {hostels.map((hostel) => (

                                            <option key={hostel.id} value={hostel.id}>{hostel.name}</option>

                                        ))}

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Room Number</label>

                                    <input

                                        type="text"

                                        value={newRoom.room_number}

                                        onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Floor Number</label>

                                    <input

                                        type="number"

                                        value={newRoom.floor_number}

                                        onChange={(e) => setNewRoom({ ...newRoom, floor_number: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Capacity (Beds)</label>

                                    <input

                                        type="number"

                                        value={newRoom.capacity}

                                        onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Status</label>

                                    <select

                                        value={newRoom.status || 'available'}

                                        onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="available">Available</option>

                                        <option value="full">Full</option>

                                        <option value="maintenance">Maintenance</option>

                                    </select>

                                </div>

                                <div className="flex justify-end space-x-3 mt-6">

                                    <button

                                        type="button"

                                        onClick={() => setShowEditRoomModal(false)}

                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"

                                    >

                                        Cancel

                                    </button>

                                    <button

                                        type="submit"

                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"

                                    >

                                        Update Room

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}



            {/* Add Bed Modal */}

            {showAddBedModal && (

                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

                        <div className="mt-3 text-center">

                            <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Bed</h3>

                            <form onSubmit={handleAddBed} className="mt-4 space-y-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Room</label>

                                    <select

                                        value={newBed.room_id}

                                        onChange={(e) => setNewBed({ ...newBed, room_id: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="">Select Room</option>

                                        {rooms.map((room) => (

                                            <option key={room.id} value={room.id}>{room.room_number}</option>

                                        ))}

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Bed Number</label>

                                    <input

                                        type="number"

                                        value={newBed.bed_number}

                                        onChange={(e) => setNewBed({ ...newBed, bed_number: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Status</label>

                                    <select

                                        value={newBed.status}

                                        onChange={(e) => setNewBed({ ...newBed, status: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="available">Available</option>

                                        <option value="occupied">Occupied</option>

                                    </select>

                                </div>

                                <div className="flex justify-end space-x-3 mt-6">

                                    <button

                                        type="button"

                                        onClick={() => setShowAddBedModal(false)}

                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"

                                    >

                                        Cancel

                                    </button>

                                    <button

                                        type="submit"

                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"

                                    >

                                        Add Bed

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}



            {/* Edit Bed Modal */}

            {showEditBedModal && (

                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

                        <div className="mt-3 text-center">

                            <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Bed</h3>

                            <form onSubmit={handleUpdateBed} className="mt-4 space-y-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Bed Number</label>

                                    <input

                                        type="text"

                                        value={editingBedData.bed_number}

                                        onChange={(e) => setEditingBedData({ ...editingBedData, bed_number: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Room</label>

                                    <select

                                        value={editingBedData.room_id}

                                        onChange={(e) => setEditingBedData({ ...editingBedData, room_id: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="">Select Room</option>

                                        {rooms.map((room) => (

                                            <option key={room.id} value={room.id}>{room.room_number}</option>

                                        ))}

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Status</label>

                                    <select

                                        value={editingBedData.status}

                                        onChange={(e) => setEditingBedData({ ...editingBedData, status: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="available">Available</option>

                                        <option value="occupied">Occupied</option>

                                    </select>

                                </div>

                                <div className="flex justify-end space-x-3 mt-6">

                                    <button

                                        type="button"

                                        onClick={() => {

                                            setShowEditBedModal(false);

                                            setEditingBed(null);

                                        }}

                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"

                                    >

                                        Cancel

                                    </button>

                                    <button

                                        type="submit"

                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"

                                    >

                                        Update Bed

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}



            {/* Edit Hostel Modal */}

            {showEditHostelModal && (

                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">

                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

                        <div className="mt-3 text-center">

                            <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Hostel</h3>

                            <form onSubmit={handleUpdateHostel} className="mt-4 space-y-4">

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Hostel Name</label>

                                    <input

                                        type="text"

                                        value={newHostel.name}

                                        onChange={(e) => setNewHostel({ ...newHostel, name: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Gender</label>

                                    <select

                                        value={newHostel.gender}

                                        onChange={(e) => setNewHostel({ ...newHostel, gender: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="">Select Gender</option>

                                        {genders.map((gender) => (

                                            <option key={gender.value} value={gender.value}>

                                                {gender.label}

                                            </option>

                                        ))}

                                    </select>

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Capacity</label>

                                    <input

                                        type="number"

                                        value={newHostel.capacity}

                                        onChange={(e) => setNewHostel({ ...newHostel, capacity: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    />

                                </div>

                                <div>

                                    <label className="block text-sm font-medium text-gray-700">Status</label>

                                    <select

                                        value={newHostel.status || 'active'}

                                        onChange={(e) => setNewHostel({ ...newHostel, status: e.target.value })}

                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"

                                        required

                                    >

                                        <option value="active">Active</option>

                                        <option value="inactive">Inactive</option>

                                        <option value="maintenance">Maintenance</option>

                                    </select>

                                </div>

                                <div className="flex justify-end space-x-3 mt-6">

                                    <button

                                        type="button"

                                        onClick={() => {

                                            setShowEditHostelModal(false);

                                            setEditingHostel(null);

                                            setNewHostel({ name: '', gender: '', capacity: '' });

                                        }}

                                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"

                                    >

                                        Cancel

                                    </button>

                                    <button

                                        type="submit"

                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"

                                    >

                                        Update Hostel

                                    </button>

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}