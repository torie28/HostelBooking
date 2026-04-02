<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transaction_hostels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_hostel_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->text('transaction_details');
            $table->string('transaction_reference')->unique();
            $table->string('payment_method');
            $table->timestamp('transaction_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaction_hostels');
    }
};
