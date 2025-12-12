<?php
/**
 * Simple PHP Proxy for GeminiGen.AI API
 *
 * Deploy this file to handle /api/geminigen/* requests
 * No dependencies required - works with basic PHP installation
 */

header('Access-Control-Allow-Origin: https://automation.pillowpotion.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, x-api-key');
header('Access-Control-Allow-Credentials: true');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get the endpoint from URL
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Map proxy endpoints to GeminiGen.AI endpoints
$endpoint = '';
if (strpos($path, '/api/geminigen/generate-image') !== false) {
    $endpoint = 'https://api.geminigen.ai/uapi/v1/generate_image';
    $method = 'POST';
} elseif (strpos($path, '/api/geminigen/generate-video') !== false) {
    $endpoint = 'https://api.geminigen.ai/uapi/v1/video-gen/veo';
    $method = 'POST';
} elseif (strpos($path, '/api/geminigen/status/') !== false) {
    $uuid = basename($path);
    $endpoint = "https://api.geminigen.ai/uapi/v1/status/$uuid";
    $method = 'GET';
} elseif (strpos($path, '/api/geminigen/test') !== false) {
    $endpoint = 'https://api.geminigen.ai/uapi/v1/generate_image';
    $method = 'POST';
} else {
    http_response_code(404);
    echo json_encode(['error' => 'INVALID_ENDPOINT', 'message' => 'Invalid proxy endpoint']);
    exit;
}

// Get API key from request header
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
if (empty($apiKey)) {
    http_response_code(401);
    echo json_encode(['error' => 'MISSING_API_KEY', 'message' => 'API key is required']);
    exit;
}

// Get request body
$requestBody = file_get_contents('php://input');

// For test endpoint, use minimal test request
if (strpos($path, '/api/geminigen/test') !== false) {
    $requestBody = json_encode([
        'prompt' => 'a simple test image',
        'model' => 'imagen-pro',
        'aspect_ratio' => '1:1',
        'style' => 'None'
    ]);
}

// Prepare cURL request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

// Set headers
$headers = [
    'x-api-key: ' . $apiKey,
    'Content-Type: application/json'
];
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Set method and body
if ($method === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);

    // Parse JSON body and convert to FormData for GeminiGen.AI
    $data = json_decode($requestBody, true);
    if ($data) {
        // Build multipart/form-data
        $boundary = '----WebKitFormBoundary' . uniqid();
        $formData = '';

        foreach ($data as $key => $value) {
            $formData .= "--$boundary\r\n";
            $formData .= "Content-Disposition: form-data; name=\"$key\"\r\n\r\n";
            $formData .= "$value\r\n";
        }
        $formData .= "--$boundary--\r\n";

        curl_setopt($ch, CURLOPT_POSTFIELDS, $formData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-api-key: ' . $apiKey,
            'Content-Type: multipart/form-data; boundary=' . $boundary
        ]);
    }
} else {
    curl_setopt($ch, CURLOPT_HTTPGET, true);
}

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Handle errors
if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'PROXY_ERROR', 'message' => $error]);
    exit;
}

// For test endpoint, return success/failure format
if (strpos($path, '/api/geminigen/test') !== false) {
    http_response_code($httpCode);
    $responseData = json_decode($response, true);

    if ($httpCode === 200) {
        echo json_encode([
            'success' => true,
            'message' => 'API connection successful!',
            'data' => $responseData
        ]);
    } else {
        $errorMsg = $responseData['detail']['message'] ?? $responseData['message'] ?? "HTTP $httpCode";
        $errorCode = $responseData['detail']['error_code'] ?? 'UNKNOWN_ERROR';

        echo json_encode([
            'success' => false,
            'message' => "Connection failed: $errorMsg",
            'error' => $errorCode,
            'statusCode' => $httpCode
        ]);
    }
    exit;
}

// Return original response
http_response_code($httpCode);
header('Content-Type: application/json');
echo $response;
?>
