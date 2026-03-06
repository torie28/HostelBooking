<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = [
        'hostel_id',
        'floor_number',
        'room_number',
        'total_beds',
        'status'
    ];

    protected $casts = [
        'hostel_id' => 'integer',
        'floor_number' => 'integer',
        'total_beds' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function hostel()
    {
        return $this->belongsTo(Hostel::class);
    }

    public function beds()
    {
        return $this->hasMany(Bed::class);
    }

    public function availableBeds()
    {
        return $this->beds()->where('status', 'available');
    }

    public function occupiedBeds()
    {
        return $this->beds()->where('status', 'occupied')->with('bookings.student');
    }

    public function getAvailableBedsCountAttribute()
    {
        return $this->availableBeds()->count();
    }

    public function getOccupiedBedsCountAttribute()
    {
        return $this->occupiedBeds()->count();
    }

    public function isFull()
    {
        return $this->occupiedBeds()->count() >= $this->total_beds;
    }
}
