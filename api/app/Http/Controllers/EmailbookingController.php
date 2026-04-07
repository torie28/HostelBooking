<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Validator;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Import models for database operations
use App\Models\Inquiry;
use App\Models\Email;
use App\Models\HostelBooking;

/**
 * Email Controller
 *
 * This controller handles all email-related functionality including
 * contact form submissions and tour inquiries.
 * It provides two main methods:
 * 1. sendContactMessage - For general contact form submissions
 * 2. sendInquiryMessage - For tour-specific inquiry submissions
 *
 * Both methods validate input, process data, and send emails to both
 * the user and company administrators.
 */
class EmailbookingController extends Controller
{
    /**
     * Process contact form submissions
     *
     * @param Request $request The incoming request with contact form data
     * @return \Illuminate\Http\JsonResponse Response indicating success or failure
     */
    public function sendContactMessage(Request $request)
    {
        // Validate the incoming request data
        $validator = Validator::make($request->all(), [
            'fullname' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
            'recaptcha_token' => 'required' // Verify reCAPTCHA token
        ]);

        // Return error response if validation fails
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Log the contact form submission for tracking purposes
        Log::info('Contact form submission received', [
            'name' => $request->fullname,
            'email' => $request->email,
            'subject' => $request->subject
        ]);

        // Prepare email data for templates
        $emailData = [
            'fullname' => $request->fullname,
            'email' => $request->email,
            'subject' => $request->subject,
            'message' => $request->message,
            'submission_date' => now()->format('Y-m-d H:i:s')
        ];

        // Generate unique thread ID for email tracking
        $threadId = 'contact-' . uniqid() . '-' . time();

        // Send confirmation email to the customer
        $customerEmailSent = $this->sendEmail(
            $emailData,
            'emails.contact.customer', // Template for customer acknowledgment
            $request->email,
            'Thank you for contacting Migada Adventure',
            env('MAIL_FROM_ADDRESS'),
            $threadId
        );

        // Send notification email to company administrators
        $companyEmailSent = $this->sendEmail(
            $emailData,
            'emails.contact.company', // Template for company notification
            env('COMPANY_EMAIL', 'info@migadadventures.com'),
            'New Contact Form Submission: ' . $request->subject,
            $request->email,
            $threadId
        );

        // Check if both emails were sent successfully
        if ($customerEmailSent && $companyEmailSent) {
            return response()->json([
                'success' => true,
                'message' => 'Your message has been sent successfully! We will get back to you shortly.'
            ], 200);
        }

        // If email sending failed, log the error and return failure response
        Log::error('Failed to send contact form emails');
        return response()->json([
            'success' => false,
            'message' => 'Failed to send your message. Please try again later.'
        ], 500);
    }

    /**
     * Process tour inquiry form submissions
     *
     * @param Request $request The incoming request with tour inquiry data
     * @return \Illuminate\Http\JsonResponse Response indicating success or failure
     */
    public function sendInquiryMessage(Request $request)
    {
        // Validate the incoming request data
        $validator = Validator::make($request->all(), [
            'firstName' => 'required|string|max:100',
            'lastName' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'adults' => 'required|integer|min:1',
            'children' => 'nullable|integer|min:0', // Changed from required to nullable
            'safariInterest' => 'required|string|max:255',
            'tourTitle' => 'nullable|string|max:255', // Optional tour title field for specific tour inquiries
            'inquiryType' => 'nullable|string|in:general,tour_specific', // Type of inquiry
            'message' => 'required|string',
            'recaptcha_token' => 'required' // Verify reCAPTCHA token
        ]);

        // Return error response if validation fails
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Log the tour inquiry submission for tracking purposes
        Log::info('Tour inquiry submission received', [
            'name' => $request->firstName . ' ' . $request->lastName,
            'email' => $request->email,
            'safari_interest' => $request->safariInterest,
            'tour_title' => $request->tourTitle ?? 'Not specified', // Log tour title if available
            'inquiry_type' => $request->inquiryType ?? 'general' // Log inquiry type
        ]);

        // Prepare email data for templates
        $emailData = [
            'firstName' => $request->firstName,
            'lastName' => $request->lastName,
            'fullName' => $request->firstName . ' ' . $request->lastName,
            'email' => $request->email,
            'phone' => $request->phone,
            'adults' => $request->adults,
            'children' => $request->children,
            'safariInterest' => $request->safariInterest,
            'tourTitle' => $request->tourTitle ?? null, // Include tour title if available
            'inquiryType' => $request->inquiryType ?? 'general', // Include inquiry type
            'message' => $request->message,
            'submission_date' => now()->format('Y-m-d H:i:s')
        ];

        // Generate unique thread ID for email tracking
        $threadId = 'inquiry-' . uniqid() . '-' . time();
        
        // Save inquiry to database
        try {
            // Log detailed information about the inquiry data before saving
            Log::info('Attempting to save inquiry to database', [
                'thread_id' => $threadId,
                'first_name' => $request->firstName,
                'last_name' => $request->lastName,
                'email' => $request->email,
                'safari_interest' => $request->safariInterest,
                'inquiry_type' => $request->inquiryType ?? 'general'
            ]);
            
            $inquiry = new Inquiry([
                'thread_id' => $threadId,
                'first_name' => $request->firstName,
                'last_name' => $request->lastName,
                'email' => $request->email,
                'phone' => $request->phone,
                'adults' => $request->adults,
                'children' => $request->children, // Now optional/nullable
                'safari_interest' => $request->safariInterest,
                'tour_title' => $request->tourTitle,
                'inquiry_type' => $request->inquiryType ?? 'general',
                'message' => $request->message,
                'status' => 'new'
            ]);
            
            $inquiry->save();
            
            // Log successful database save
            Log::info('Inquiry saved to database', ['thread_id' => $threadId]);
        } catch (\Exception $e) {
            // Log detailed database error but continue with email sending
            Log::error('Failed to save inquiry to database', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'thread_id' => $threadId
            ]);
        }

        // Add detailed logging before sending emails
        Log::info('Preparing to send confirmation emails', [
            'customer_email' => $request->email,
            'company_email' => env('COMPANY_EMAIL', 'ishaqaicon5@gmail.com'),
            'thread_id' => $threadId,
            'mail_config' => [
                'host' => env('MAIL_HOST'),
                'port' => env('MAIL_PORT'),
                'encryption' => env('MAIL_ENCRYPTION'),
                'from_address' => env('MAIL_FROM_ADDRESS'),
                'from_name' => env('MAIL_FROM_NAME')
            ]
        ]);
        
        // Try to send confirmation email to the customer
        try {
            $customerEmailSent = $this->sendEmail(
                $emailData,
                'emails.inquiry.customer', // Template for customer acknowledgment
                $request->email,
                'Thank you for your safari inquiry - Migada Adventure',
                env('MAIL_FROM_ADDRESS'),
                $threadId
            );
            Log::info('Customer confirmation email result', ['success' => $customerEmailSent]);
        } catch (\Exception $e) {
            Log::error('Exception while sending customer email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'thread_id' => $threadId
            ]);
            $customerEmailSent = false;
        }

        // Try to send notification email to company administrators
        try {
            $companyEmailSent = $this->sendEmail(
                $emailData,
                'emails.inquiry.company', // Template for company notification
                env('COMPANY_EMAIL', 'ishaqaicon5@gmail.com'),
                // Use tour title in subject if available, otherwise use safari interest
                'New Safari Inquiry: ' . ($request->tourTitle ? $request->tourTitle : $request->safariInterest),
                $request->email,
                $threadId
            );
            Log::info('Company notification email result', ['success' => $companyEmailSent]);
        } catch (\Exception $e) {
            Log::error('Exception while sending company email', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'thread_id' => $threadId
            ]);
            $companyEmailSent = false;
        }

        // Check if both emails were sent successfully
        if ($customerEmailSent && $companyEmailSent) {
            // Update inquiry status to indicate it's been responded to
            try {
                $inquiry = Inquiry::where('thread_id', $threadId)->first();
                if ($inquiry) {
                    $inquiry->status = 'responded';
                    $inquiry->responded_at = now();
                    $inquiry->save();
                }
            } catch (\Exception $e) {
                // Log database error but continue with response
                Log::error('Failed to update inquiry status', [
                    'error' => $e->getMessage(),
                    'thread_id' => $threadId
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Your inquiry has been sent successfully! We will get back to you shortly.'
            ], 200);
        }

        // If email sending failed, log the error and return failure response with more details
        $errorDetails = [
            'customer_email_sent' => $customerEmailSent,
            'company_email_sent' => $companyEmailSent,
            'thread_id' => $threadId
        ];
        
        Log::error('Failed to send tour inquiry emails', $errorDetails);
        
        // Store the inquiry anyway if database saving was successful
        try {
            $inquiry = Inquiry::where('thread_id', $threadId)->first();
            if ($inquiry) {
                $inquiry->status = 'in_progress'; // Using a valid enum value from the schema
                $inquiry->admin_notes = json_encode($errorDetails); // Fixed column name from 'notes' to 'admin_notes'
                $inquiry->save();
                
                Log::info('Inquiry status updated to error', ['thread_id' => $threadId]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to update inquiry status after email failure', [
                'error' => $e->getMessage(),
                'thread_id' => $threadId
            ]);
        }
        
        // Return a more specific error message based on which email failed
        if (!$customerEmailSent && !$companyEmailSent) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send your inquiry. Please try again later.',
                'error_code' => 'both_emails_failed'
            ], 500);
        } else if (!$customerEmailSent) {
            return response()->json([
                'success' => false,
                'message' => 'Your inquiry was received, but we could not send you a confirmation email. Please check your email address.',
                'error_code' => 'customer_email_failed'
            ], 500);
        } else {
            return response()->json([
                'success' => false,
                'message' => 'Your inquiry was received, but our notification system encountered an error. Our team will contact you soon.',
                'error_code' => 'company_email_failed'
            ], 500);
        }
    }

    /**
     * Send booking confirmation email
     *
     * @param int $bookingId The ID of the booking
     * @return \Illuminate\Http\JsonResponse Response indicating success or failure
     */
    public function sendBookingConfirmation($bookingId)
    {
        try {
            // Get the booking with related data
            $booking = HostelBooking::with(['bed.room.hostel'])->find($bookingId);
            
            if (!$booking) {
                return response()->json([
                    'success' => false,
                    'message' => 'Booking not found'
                ], 404);
            }

            // Generate unique thread ID for email tracking
            $threadId = 'booking-' . $booking->id . '-' . uniqid() . '-' . time();

            // Prepare email data for template
            $emailData = [
                'booking' => $booking,
                'student_name' => $booking->student_name,
                'booking_id' => $booking->id,
                'control_number' => $booking->controlnumber,
                'room_number' => $booking->room_number,
                'academic_year' => $booking->academic_year,
                'amount' => $booking->amount,
                'booking_date' => $booking->booking_date,
                'status' => $booking->status,
                'submission_date' => now()->format('Y-m-d H:i:s')
            ];

            // Log the booking email preparation
            Log::info('Preparing booking confirmation email', [
                'booking_id' => $booking->id,
                'student_name' => $booking->student_name,
                'thread_id' => $threadId
            ]);

            // Send booking confirmation email to the student
            $emailSent = $this->sendEmail(
                $emailData,
                'emails.booking', // Template for booking confirmation
                $this->getStudentEmail($booking), // Get student email
                'Hostel Booking Confirmation - Booking #' . $booking->id,
                env('MAIL_FROM_ADDRESS'),
                $threadId
            );

            if ($emailSent) {
                return response()->json([
                    'success' => true,
                    'message' => 'Booking confirmation email sent successfully',
                    'thread_id' => $threadId
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send booking confirmation email'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Exception in sendBookingConfirmation', [
                'booking_id' => $bookingId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending booking confirmation email'
            ], 500);
        }
    }

    /**
     * Get student email from booking
     * This method uses the student_email from the booking record
     *
     * @param HostelBooking $booking
     * @return string|null
     */
    private function getStudentEmail($booking)
    {
        // Use the student_email from the booking record
        if ($booking->student_email) {
            return $booking->student_email;
        }

        // Fallback: try to get user by admission number
        try {
            $user = \App\Models\User::where('admission_number', $booking->admission_number)->first();
            if ($user && $user->email) {
                return $user->email;
            }
        } catch (\Exception $e) {
            Log::error('Failed to get student email from User model', [
                'admission_number' => $booking->admission_number,
                'error' => $e->getMessage()
            ]);
        }

        // Final fallback: return a default email or null
        Log::warning('No student email found for booking', [
            'booking_id' => $booking->id,
            'admission_number' => $booking->admission_number
        ]);
        
        return env('DEFAULT_STUDENT_EMAIL', 'student@example.com');
    }

    /**
     * Private helper method to send emails using PHPMailer
     * This method also records email details in the database for tracking
     *
     * @param array $data Email data to be passed to the template
     * @param string $template Blade template path for email content
     * @param string $recipientEmail Email address of the recipient
     * @param string $subject Subject line for the email
     * @param string $replyToEmail Reply-to email address
     * @param string $threadId Unique identifier for email threading
     * @return bool True if email was sent successfully, False otherwise
     */
    private function sendEmail($data, $template, $recipientEmail, $subject, $replyToEmail, $threadId)
    {
        // Log data being sent for debugging purposes
        Log::info("Preparing to send email with template: {$template}", [
            'recipient' => $recipientEmail,
            'subject' => $subject,
            'thread_id' => $threadId
        ]);
        
        // Determine email type based on template path
        $emailType = 'other';
        if (strpos($template, 'inquiry.customer') !== false) {
            $emailType = 'inquiry_customer';
        } elseif (strpos($template, 'inquiry.company') !== false) {
            $emailType = 'inquiry_company';
        } elseif (strpos($template, 'contact.customer') !== false) {
            $emailType = 'contact_customer';
        } elseif (strpos($template, 'contact.company') !== false) {
            $emailType = 'contact_company';
        } elseif (strpos($template, 'booking') !== false) {
            $emailType = 'booking_confirmation';
        }

        // Require the PHPMailer autoloader
        require base_path('vendor/autoload.php');

        // Create a new PHPMailer instance
        $mail = new PHPMailer(true);

        try {
            // Render the email template with data
            $htmlTemplate = View::make($template, ['data' => $data])->render();

            // Configure PHPMailer with SMTP settings from .env file
            $mail->isSMTP();
            $mail->Host       = env('MAIL_HOST');
            $mail->SMTPAuth   = true;
            $mail->Username   = env('MAIL_USERNAME');
            $mail->Password   = env('MAIL_PASSWORD');
            
            // Log SMTP configuration (without password)
            Log::info('SMTP Configuration', [
                'host' => env('MAIL_HOST'),
                'port' => env('MAIL_PORT'),
                'username' => env('MAIL_USERNAME'),
                'encryption' => env('MAIL_ENCRYPTION'),
                'from_address' => env('MAIL_FROM_ADDRESS')
            ]);

            // Set encryption type based on MAIL_ENCRYPTION from .env (default to TLS if not set)
            $encryption = strtolower(env('MAIL_ENCRYPTION', 'tls'));
            if ($encryption === 'tls') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            } elseif ($encryption === 'ssl') {
                $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            }
            
            // Disable SSL certificate verification for troubleshooting
            // IMPORTANT: This should be removed in production for security
            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false,
                    'allow_self_signed' => true
                ]
            ];

            $mail->Port       = env('MAIL_PORT');
            $mail->Timeout    = 60;  // 60 seconds timeout for SMTP operations
            
            // Set debug level but capture output instead of printing it directly
            // 0 = off, 1 = client messages, 2 = client and server messages
            $mail->SMTPDebug  = 0;   // Set to 0 for production, higher values for debugging
            
            // Capture debug output instead of printing it directly
            $mail->Debugoutput = function($str, $level) use ($threadId) {
                // Log the debug output instead of printing it
                Log::debug("SMTP Debug: " . trim($str), [
                    'level' => $level,
                    'thread_id' => $threadId
                ]);
            };

            // Configure email sender, recipient, and reply-to
            $mail->setFrom(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME'));
            $mail->addAddress($recipientEmail);
            $mail->addReplyTo($replyToEmail, env('MAIL_FROM_NAME'));

            // Generate a unique message ID for this email
            $messageId = uniqid() . '@' . env('MAIL_HOST');
            
            // Add email headers for proper threading and tracking
            $mail->MessageID = '<' . $messageId . '>';
            $mail->addCustomHeader('X-Entity-Ref-ID', $threadId);

            // Set email content and subject
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlTemplate;

            // Render plain text version of the email for storage
            $plainTextContent = strip_tags(str_replace(['<br>', '<br/>', '<br />', '</p>'], "\n", $htmlTemplate));
            
            // Create email record in database
            try {
                $emailRecord = new Email([
                    'message_id' => $messageId,
                    'thread_id' => $threadId,
                    'subject' => $subject,
                    'from_email' => env('MAIL_FROM_ADDRESS'),
                    'from_name' => env('MAIL_FROM_NAME'),
                    'to_email' => $recipientEmail,
                    'reply_to' => $replyToEmail,
                    'email_type' => $emailType,
                    'content' => $htmlTemplate,
                    'plain_content' => $plainTextContent,
                    'send_attempts' => 1
                ]);
            } catch (\Exception $e) {
                // Log database error but continue with email sending
                Log::error('Failed to create email record', [
                    'error' => $e->getMessage(),
                    'thread_id' => $threadId
                ]);
            }
            
            // Send the email and check for success
            if (!$mail->send()) {
                // Update email record with failure information
                if (isset($emailRecord)) {
                    $emailRecord->sent_successfully = false;
                    $emailRecord->error_message = $mail->ErrorInfo;
                    $emailRecord->save();
                }
                
                Log::error("Email sending failed. Error: " . $mail->ErrorInfo);
                return false;
            }

            // Update email record with success information
            if (isset($emailRecord)) {
                $emailRecord->sent_successfully = true;
                $emailRecord->sent_at = now();
                $emailRecord->save();
            }

            // Log success and return true
            Log::info("Email sent successfully to: {$recipientEmail} with thread ID: {$threadId}");
            return true;

        } catch (Exception $e) {
            // Update email record with exception information if it exists
            if (isset($emailRecord)) {
                $emailRecord->sent_successfully = false;
                $emailRecord->error_message = $e->getMessage();
                $emailRecord->save();
            }
            
            // Log detailed information about the exception
            Log::error("Email sending exception: " . $e->getMessage(), [
                'thread_id' => $threadId,
                'recipient' => $recipientEmail,
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'smtp_host' => env('MAIL_HOST'),
                'smtp_port' => env('MAIL_PORT'),
                'smtp_encryption' => env('MAIL_ENCRYPTION'),
                'smtp_username' => env('MAIL_USERNAME'),
                'smtp_from' => env('MAIL_FROM_ADDRESS')
            ]);
            
            // Log the full stack trace for debugging
            Log::debug("Email exception stack trace", [
                'trace' => $e->getTraceAsString(),
                'thread_id' => $threadId
            ]);
            
            return false;
        }
    }
}
