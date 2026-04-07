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
        Schema::table('hostel_bookings', function (Blueprint $table) {
            $table->string('student_email')->nullable()->after('admission_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hostel_bookings', function (Blueprint $table) {
            $table->dropColumn('student_email');
        });
    }
};
