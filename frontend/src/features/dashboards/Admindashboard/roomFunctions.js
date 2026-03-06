// Room management functions for AdminDashboard
export const handleEditRoom = (room, setEditingRoom, setNewRoom, setShowEditRoomModal) => {
    setEditingRoom(room);
    setNewRoom({
        hostel_id: room.hostel_id.toString(),
        room_number: room.room_number,
        floor_number: room.floor_number.toString(),
        capacity: room.capacity.toString(),
        status: room.status || 'available'
    });
    setShowEditRoomModal(true);
};

export const handleUpdateRoom = async (newRoom, editingRoom, fetchData, setShowEditRoomModal, setEditingRoom, setNewRoom) => {
    try {
        const response = await fetch(`http://localhost:8000/api/rooms/${editingRoom.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({
                hostel_id: parseInt(newRoom.hostel_id),
                floor_number: parseInt(newRoom.floor_number),
                room_number: newRoom.room_number,
                total_beds: parseInt(newRoom.capacity),
                status: newRoom.status
            })
        });

        if (response.ok) {
            await fetchData();
            setShowEditRoomModal(false);
            setEditingRoom(null);
            setNewRoom({ hostel_id: '', room_number: '', floor_number: '', capacity: 4, status: 'available' });
        } else {
            const errorData = await response.json();
            console.error('Error updating room:', errorData);
        }
    } catch (error) {
        console.error('Error updating room:', error);
    }
};

export const handleDeleteRoom = async (roomId, fetchData) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
        try {
            const response = await fetch(`http://localhost:8000/api/rooms/${roomId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            });

            if (response.ok) {
                await fetchData();
            } else {
                const errorData = await response.json();
                console.error('Error deleting room:', errorData);
            }
        } catch (error) {
            console.error('Error deleting room:', error);
        }
    }
};
