<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HostelBooking extends Model
{
    protected $fillable = [
        'hostel_id',
        'room_number',
        'bed_id',
        'status',
        'academic_year',
        'student_name',
        'admission_number',
        'amount',
        'controlnumber',
        'booking_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'booking_date' => 'date',
    ];

    // Relationships
    public function hostel()
    {
        return $this->belongsTo(Hostel::class);
    }

    public function bed()
    {
        return $this->belongsTo(Bed::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'admission_number', 'admission_number');
    }
}
