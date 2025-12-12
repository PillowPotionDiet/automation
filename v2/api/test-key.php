<?php
/**
 * API KEY VALIDATION ENDPOINT
 * Backend proxy to test GeminiGen API key without CORS issues
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed. Use POST.'
    ]);
    exit;
}

// Get JSON body
$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);

if (!$data || !isset($data['apiKey'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing apiKey in request body'
    ]);
    exit;
}

$apiKey = $data['apiKey'];

if (empty($apiKey)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'API key cannot be empty'
    ]);
    exit;
}

// Make request to GeminiGen API (server-side, no CORS)
$ch = curl_init();

$requestBody = json_encode([
    'prompt' => 'validation test',
    'model' => 'imagen-pro'
]);

curl_setopt($ch, CURLOPT_URL, 'https://api.geminigen.ai/uapi/v1/generate_image');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ' . $apiKey
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Handle curl errors
if ($curlError) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Network error: ' . $curlError
    ]);
    exit;
}

// Safe JSON parse
$responseData = null;
if ($response) {
    $responseData = json_decode($response, true);
}

// If not valid JSON, check if it's HTML (404 page)
if (!$responseData) {
    if (stripos($response, '<!DOCTYPE') !== false || stripos($response, '<html') !== false) {
        http_response_code(502);
        echo json_encode([
            'success' => false,
            'message' => 'API endpoint returned HTML instead of JSON'
        ]);
        exit;
    }
}

// Return based on HTTP code
if ($httpCode === 200) {
    // Success
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'API connection successful!',
        'data' => $responseData
    ]);
} else {
    // Error from GeminiGen
    $errorMsg = $responseData['detail']['message'] ?? $responseData['message'] ?? "HTTP $httpCode";
    $errorCode = $responseData['detail']['error_code'] ?? 'UNKNOWN_ERROR';

    http_response_code(200); // Return 200 to frontend but with success: false
    echo json_encode([
        'success' => false,
        'message' => $errorMsg,
        'error' => $errorCode,
        'statusCode' => $httpCode
    ]);
}
?>
