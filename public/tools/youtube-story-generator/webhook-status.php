<?php
/**
 * WEBHOOK STATUS ENDPOINT
 * Allows frontend to poll for webhook results by UUID
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get UUID from URL path
// URL: /webhook-status/{uuid}
$requestUri = $_SERVER['REQUEST_URI'];
$pathParts = explode('/', trim($requestUri, '/'));
$uuid = end($pathParts);

if (empty($uuid)) {
    http_response_code(400);
    echo json_encode(['error' => 'UUID required']);
    exit;
}

// Storage directory
$storageDir = __DIR__ . '/webhook-data';
$filename = $storageDir . '/' . $uuid . '.json';

// Check if webhook data exists
if (!file_exists($filename)) {
    // No webhook received yet - return pending status
    http_response_code(200);
    echo json_encode([
        'uuid' => $uuid,
        'status' => 1, // Processing
        'status_percentage' => 0,
        'status_desc' => 'Waiting for webhook...',
        'message' => 'No webhook data received yet'
    ]);
    exit;
}

// Load webhook data
$record = json_decode(file_get_contents($filename), true);

if (!$record) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to load webhook data']);
    exit;
}

// Extract relevant data from webhook
$webhookData = $record['data'];
$event_name = $record['event_name'] ?? '';

// Prepare response based on event type
$response = [
    'uuid' => $uuid,
    'event_name' => $event_name,
    'timestamp' => $record['timestamp']
];

// Map webhook data to standard response format
if ($event_name === 'IMAGE_GENERATION_COMPLETED' || $event_name === 'VIDEO_GENERATION_COMPLETED') {
    // Extract status info
    $response['status'] = $webhookData['status'] ?? 2; // 1=processing, 2=completed, 3=failed
    $response['status_percentage'] = $webhookData['status_percentage'] ?? 100;
    $response['status_desc'] = $webhookData['status_desc'] ?? 'Completed';

    // Extract media URLs
    $response['media_url'] = $webhookData['media_url'] ?? null;
    $response['thumbnail_url'] = $webhookData['thumbnail_url'] ?? null;
    $response['generate_result'] = $webhookData['generate_result'] ?? null;

    // Extract credit info
    $response['used_credit'] = $webhookData['used_credit'] ?? 0;

    // Check if failed
    if ($webhookData['status'] === 3) {
        $response['error_message'] = $webhookData['error_message'] ?? 'Generation failed';
    }
} else {
    // Unknown event type or still processing
    $response['status'] = 1;
    $response['status_percentage'] = $webhookData['status_percentage'] ?? 0;
    $response['status_desc'] = $webhookData['status_desc'] ?? 'Processing';
}

http_response_code(200);
echo json_encode($response);
?>
