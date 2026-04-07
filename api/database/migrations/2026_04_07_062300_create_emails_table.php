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
        Schema::create('emails', function (Blueprint $table) {
            $table->id();
            $table->string('message_id')->unique();
            $table->string('thread_id');
            $table->string('subject');
            $table->string('from_email');
            $table->string('from_name')->nullable();
            $table->string('to_email');
            $table->string('reply_to')->nullable();
            $table->string('email_type')->default('other');
            $table->longText('content');
            $table->longText('plain_content')->nullable();
            $table->boolean('sent_successfully')->default(false);
            $table->text('error_message')->nullable();
            $table->integer('send_attempts')->default(1);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            
            $table->index('thread_id');
            $table->index('email_type');
            $table->index('sent_successfully');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('emails');
    }
};
