<?php

namespace App\Http\Controllers\AAATS;

use App\Http\Controllers\Controller;
use App\Models\AAATS\DocumentRequest;
use App\Models\AAATS\Payment;
use App\Models\AAATS\PaymentTransaction;
use App\Models\AAATS\Approval;
use App\Models\AAATS\Institution;
use App\Models\Department;
use App\Notifications\PaymentReceived;
use App\Notifications\DocumentRequestStatusUpdated;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Validator;
use App\Services\SmsService;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected $smsService;

    /**
     * Create a new controller instance.
     *
     * @param SmsService $smsService
     */
    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    /**
     * Check payment status by control number.
     *
     * @param  string  $controlNumber
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkPaymentStatus(string $controlNumber): JsonResponse
    {
        try {
            $payment = Payment::where('control_number', $controlNumber)
                ->with('documentRequest')
                ->first();

            if (!$payment) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Payment not found'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'control_number' => $payment->control_number,
                    'amount' => $payment->amount,
                    'payment_status' => $payment->payment_status,
                    'payment_expiration_status' => $payment->payment_expiration_status,
                    'expires_at' => $payment->expires_at,
                    'payment_method' => $payment->payment_method,
                    'document_request' => $payment->documentRequest
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to check payment status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate a control number for a document request payment.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function generateControlNumber(Request $request): JsonResponse
    {
        try {
            // Get student details
            $student = Auth::guard('student')->user();
            if (!$student) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Only students can make payments'
                ], 403);
            }

            // Validate request
            $validator = Validator::make($request->all(), [
                'document_request_id' => 'required|exists:document_requests,id',
                'payment_method' => 'required|in:mobile_money,bank'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get document request
            $documentRequest = DocumentRequest::findOrFail($request->document_request_id);
            
            // Generate control number (99 + 10 random digits)
            $controlNumber = '99' . str_pad(mt_rand(0, 9999999999), 10, '0', STR_PAD_LEFT);
            
            // Get institution code
            $institution = $student->studentMaster->institution;
            
            // Generate reference number (Institution code + document request ID padded to 4 digits + 8 random digits)
            $referenceNumber = $institution->code . str_pad($documentRequest->id, 4, '0', STR_PAD_LEFT) . str_pad(mt_rand(0, 99999999), 8, '0', STR_PAD_LEFT);

            // Create payment record with reference number
            $payment = Payment::create([
                'document_request_id' => $request->document_request_id,
                'control_number' => $controlNumber,
                'reference_number' => $referenceNumber, // Store reference in reference_number
                'amount' => $documentRequest->fee_amount,
                'payment_method' => $request->payment_method,
                'payment_status' => Payment::STATUS_PENDING,
                'payment_expiration_status' => Payment::EXPIRATION_STATUS_PENDING,
                'expires_at' => Carbon::now()->addHours(24)
            ]);

            // Format SMS message
            $message = "Malipo yamepokelewa kwenda {$institution->code}\n";
            $message .= "Ankara: {$controlNumber}\n";
            $message .= "Kiasi: " . number_format($payment->amount) . " TZS\n";
            $message .= "Risiti: N/A\n";
            $message .= now()->format('Y-m-d\TH:i:s') . "\n";
            $message .= "Kupitia: {$referenceNumber}";

            // Send SMS
            $smsResult = $this->smsService->sendSms(
                $student->studentMaster->phone,
                $message
            );

            if (!$smsResult['success']) {
                Log::error('Failed to send payment SMS', [
                    'student_id' => $student->id,
                    'payment_id' => $payment->id,
                    'error' => $smsResult['error']
                ]);
            }

            // Update document request status
            $documentRequest->update([
                'status' => 'pending_payment' // This must match the enum values in the migration
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Your control number has been generated successfully. Please check your phone for an SMS with payment instructions.',
                'data' => [
                    'control_number' => $payment->control_number,
                    'reference_number' => $payment->reference_number,
                    'amount' => $payment->amount,
                    'expires_at' => $payment->expires_at,
                    'payment_method' => $payment->payment_method
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Sorry, we could not generate your control number at this time. Please try again or contact support if the problem persists.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify a payment for a document request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyPayment(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'control_number' => 'required|string',
                'transaction_reference' => 'required|string'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Find payment by control number
            $payment = Payment::where('control_number', $request->control_number)
                ->with('documentRequest')
                ->first();

            if (!$payment) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Payment not found'
                ], 404);
            }

            // Check if payment is already completed
            if ($payment->payment_status === 'completed') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Payment already verified'
                ], 422);
            }

            // Update payment status
            $payment->payment_status = 'completed';
            $payment->transaction_reference = $request->transaction_reference;
            $payment->payment_date = now();
            $payment->save();

            // Get associated document request
            $documentRequest = $payment->documentRequest;

            // Update document request status to pending department officer approval (first step in approval flow)
            // This follows the correct sequence: Payment -> Department Officer -> Library -> Finance -> etc.
            $documentRequest->status = 'pending_department_officer_approval';
            $documentRequest->save();

            // Create approval requests
            $this->createApprovalRequests($documentRequest);

            // Send notification to student
            $student = $documentRequest->student;
            Notification::send($student, new DocumentRequestStatusUpdated($documentRequest));

            return response()->json([
                'status' => 'success',
                'message' => 'Great! Your payment has been verified successfully. Your document request is now being processed.',
                'data' => [
                    'payment' => $payment->fresh(),
                    'document_request' => $documentRequest->fresh()
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to verify payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create approval requests for each department.
     *
     * @param  \App\Models\AAATS\DocumentRequest  $documentRequest
     * @return void
     */
    private function createApprovalRequests(DocumentRequest $documentRequest)
    {
        // Get departments that need to approve
        $departments = Department::where('institution_id', $documentRequest->student->institution_id)
            ->whereIn('name', ['Academic', 'Finance', 'Library'])
            ->get();
        
        foreach ($departments as $department) {
            Approval::create([
                'document_request_id' => $documentRequest->id,
                'department_id' => $department->id,
                'status' => 'pending',
                'comments' => null,
            ]);
        }
    }

    /**
     * Verify payment status for a control number.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyPaymentStatus(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'control_number' => 'required|string|size:12',
                'transaction_reference' => 'required|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $payment = Payment::where('control_number', $request->control_number)
                ->where('payment_status', '!=', Payment::STATUS_COMPLETED)
                ->first();

            if (!$payment) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Invalid control number or payment already completed'
                ], 404);
            }

            if ($payment->hasExpired()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Control number has expired'
                ], 422);
            }

            // Update payment record
            $payment->update([
                'payment_status' => Payment::STATUS_COMPLETED,
                'transaction_reference' => $request->transaction_reference,
                'payment_date' => Carbon::now()
            ]);

            // Update document request status to pending department officer approval
            // This follows the correct sequence: Payment -> Department Officer -> Library -> Finance -> etc.
            $payment->documentRequest->update([
                'status' => 'pending_department_officer_approval'
            ]);
            
            // Create approval requests for the document request if they don't exist yet
            $this->createApprovalRequests($payment->documentRequest);

            return response()->json([
                'status' => 'success',
                'message' => 'Payment verified successfully',
                'data' => [
                    'control_number' => $payment->control_number,
                    'amount' => $payment->amount,
                    'payment_date' => $payment->payment_date,
                    'transaction_reference' => $payment->transaction_reference
                ]
            ]);

        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to verify payment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
