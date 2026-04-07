<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Email Model
 * 
 * This model represents an email sent through the system.
 * It stores details about each email including sender/recipient information,
 * content, status, and relationship to inquiries via thread_id.
 * 
 * The model provides methods to create, retrieve, and manage email records
 * for tracking and reference purposes.
 */
class Email extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'emails';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'message_id',
        'thread_id',
        'subject',
        'from_email',
        'from_name',
        'to_email',
        'reply_to',
        'email_type',
        'content',
        'plain_content',
        'sent_successfully',
        'error_message',
        'send_attempts',
        'sent_at'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'sent_successfully' => 'boolean',
        'send_attempts' => 'integer',
        'sent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the inquiry associated with this email.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function inquiry()
    {
        return $this->belongsTo(Inquiry::class, 'thread_id', 'thread_id');
    }

    /**
     * Get the booking associated with this email.
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function booking()
    {
        return $this->belongsTo(HostelBooking::class, 'thread_id', 'thread_id');
    }

    /**
     * Scope a query to only include successfully sent emails.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSent($query)
    {
        return $query->where('sent_successfully', true);
    }

    /**
     * Scope a query to only include failed emails.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeFailed($query)
    {
        return $query->where('sent_successfully', false);
    }

    /**
     * Scope a query to only include booking confirmation emails.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeBookingConfirmations($query)
    {
        return $query->where('email_type', 'booking_confirmation');
    }
}
