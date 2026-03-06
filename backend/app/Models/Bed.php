<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bed extends Model
{
    protected $fillable = [
        'room_id',
        'bed_number',
        'status',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function bookings()
    {
        return $this->hasMany(HostelBooking::class, 'bed_id');
    }

    public function activeBooking()
    {
        return $this->bookings()->where('status', 'active')->with('student');
    }
}
