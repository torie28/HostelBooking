<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HostelBooking extends Model
{
    protected $fillable = [
        'student_id',
        'bed_id',
        'status',
        'amount',
        'controlnumber',
        'booking_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'booking_date' => 'date',
    ];

    // Relationships
    public function bed()
    {
        return $this->belongsTo(Bed::class);
    }

    // Accessors for getting hostel and room through bed
    public function getHostelAttribute()
    {
        return $this->bed?->room?->hostel;
    }

    public function getRoomAttribute()
    {
        return $this->bed?->room;
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    // Accessors for getting student information through relationship
    public function getStudentNameAttribute()
    {
        return $this->student?->name;
    }

    public function getStudentEmailAttribute()
    {
        return $this->student?->email;
    }

    public function getAcademicYearAttribute()
    {
        return $this->student?->academic_year;
    }

    public function getAdmissionNumberAttribute()
    {
        return $this->student?->admission_number;
    }
}
