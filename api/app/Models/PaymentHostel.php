<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentHostel extends Model
{
    protected $fillable = [
        'student_id',
        'academic_year',
        'booking_id',
        'amount',
        'status',
        'due_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    // Relationships
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function booking()
    {
        return $this->belongsTo(HostelBooking::class, 'booking_id');
    }

    public function transactions()
    {
        return $this->hasMany(TransactionHostel::class, 'payment_id');
    }
}
