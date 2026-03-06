<?php

namespace App\Http\Controllers;

use App\Models\TransactionHostel;
use App\Models\PaymentHostel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TransactionHostelController extends Controller
{
    public function index()
    {
        $transactions = TransactionHostel::with(['paymentHostel.student'])->get();
        return response()->json($transactions);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_hostel_id' => 'required|exists:payment_hostels,id',
            'amount' => 'required|numeric|min:0',
            'transaction_reference' => 'required|string|max:255|unique:transaction_hostels',
            'payment_method' => 'required|string|max:100',
            'status' => 'required|in:pending,completed,failed,refunded',
            'transaction_details' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $transaction = TransactionHostel::create([
                'payment_hostel_id' => $request->payment_hostel_id,
                'amount' => $request->amount,
                'transaction_reference' => $request->transaction_reference,
                'payment_method' => $request->payment_method,
                'status' => $request->status,
                'transaction_details' => $request->transaction_details,
                'transaction_date' => now(),
            ]);

            // Update payment status if transaction is completed
            if ($request->status === 'completed') {
                $payment = PaymentHostel::find($request->payment_hostel_id);
                if ($payment) {
                    $payment->status = 'paid';
                    $payment->save();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Transaction created successfully',
                'transaction' => $transaction->load(['paymentHostel.student'])
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction creation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $transaction = TransactionHostel::with(['paymentHostel.student', 'paymentHostel.booking'])->find($id);
        
        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        return response()->json($transaction);
    }

    public function update(Request $request, $id)
    {
        $transaction = TransactionHostel::find($id);
        
        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|in:pending,completed,failed,refunded',
            'transaction_details' => 'sometimes|nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $oldStatus = $transaction->status;
            $transaction->update($request->only(['status', 'transaction_details']));

            // Update payment status based on transaction status change
            if ($oldStatus !== $request->status) {
                $payment = PaymentHostel::find($transaction->payment_hostel_id);
                if ($payment) {
                    if ($request->status === 'completed') {
                        $payment->status = 'paid';
                    } else if ($request->status === 'failed' || $request->status === 'refunded') {
                        $payment->status = 'pending';
                    }
                    $payment->save();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Transaction updated successfully',
                'transaction' => $transaction->load(['paymentHostel.student', 'paymentHostel.booking'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction update failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $transaction = TransactionHostel::find($id);
        
        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction not found'
            ], 404);
        }

        try {
            $transaction->delete();

            return response()->json([
                'success' => true,
                'message' => 'Transaction deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction deletion failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getTransactionsByPayment($paymentId)
    {
        $payment = PaymentHostel::find($paymentId);
        
        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $transactions = TransactionHostel::where('payment_hostel_id', $paymentId)
            ->orderBy('transaction_date', 'desc')
            ->get();

        return response()->json($transactions);
    }

    public function getCompletedTransactions()
    {
        $completedTransactions = TransactionHostel::where('status', 'completed')
            ->with(['paymentHostel.student'])
            ->orderBy('transaction_date', 'desc')
            ->get();

        return response()->json($completedTransactions);
    }
}
