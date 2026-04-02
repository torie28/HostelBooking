<?php

require_once 'vendor/autoload.php';

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

// Test data for registration
$testData = [
    'name' => 'Test User',
    'email' => 'test' . time() . '@example.com',
    'admission_number' => 'ADM' . time(),
    'level_id' => 1,
    'phone_number' => '+1234567890',
    'password' => 'Test123456',
    'password_confirmation' => 'Test123456'
];

echo "Testing registration endpoint...\n";
echo "Test data: " . json_encode($testData, JSON_PRETTY_PRINT) . "\n\n";

// Make request to registration endpoint
$ch = curl_init('http://localhost:8000/api/register');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response: $response\n";

if ($httpCode === 201) {
    echo "\n✅ Registration endpoint is working correctly!\n";
} else {
    echo "\n❌ Registration endpoint failed.\n";
}
