<?php
/**
 * API PROXY for GeminiGen.AI
 * Routes all /api/geminigen/* requests to GeminiGen.AI API
 */

header('Access-Control-Allow-Origin: *');
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

// GeminiGen.AI API base URL
$GEMINIGEN_BASE_URL = 'https://api.geminigen.ai';

// Map proxy endpoints to GeminiGen.AI endpoints
$endpoint = '';
$method = $_SERVER['REQUEST_METHOD'];

if (strpos($path, '/api/geminigen/generate-image') !== false) {
    $endpoint = '/uapi/v1/generate_image';
} elseif (strpos($path, '/api/geminigen/generate-video') !== false) {
    $endpoint = '/uapi/v1/video-gen/veo';
} elseif (preg_match('#/api/geminigen/status/(.+)#', $path, $matches)) {
    $uuid = $matches[1];
    $endpoint = "/uapi/v1/status/$uuid";
} elseif (strpos($path, '/api/geminigen/test') !== false) {
    $endpoint = '/uapi/v1/generate_image';
    $_isTest = true;
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
if (isset($_isTest)) {
    $requestBody = json_encode([
        'prompt' => 'a simple test image',
        'model' => 'imagen-pro',
        'aspect_ratio' => '1:1',
        'style' => 'None'
    ]);
}

// Prepare cURL request
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $GEMINIGEN_BASE_URL . $endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

// Build headers and body based on method
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
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'x-api-key: ' . $apiKey
    ]);
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
if (isset($_isTest)) {
    header('Content-Type: application/json');
    http_response_code(200);
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
