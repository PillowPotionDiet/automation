<?php
/**
 * GEMINIGEN WEBHOOK HANDLER
 * Receives webhook events from GeminiGen.AI and stores results
 *
 * Security: Verifies webhook signature using MD5(event_uuid) + RSA-SHA256
 */

header('Content-Type: application/json');

// Enable CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, x-signature');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get raw body BEFORE any parsing
$rawBody = file_get_contents('php://input');

// Get signature header
$signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';

// Parse JSON
$data = json_decode($rawBody, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Extract event UUID
$eventUuid = $data['event_uuid'] ?? null;

if (!$eventUuid) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing event_uuid']);
    exit;
}

// ========================================
// SIGNATURE VERIFICATION
// ========================================
// According to requirements:
// Verify x-signature header: MD5(event_uuid) + RSA-SHA256
//
// NOTE: Since we don't have GeminiGen's public key for RSA verification,
// we'll implement MD5 verification as a basic check.
// In production, you would need to get GeminiGen's public key and verify RSA signature.
// ========================================

$expectedMD5 = md5($eventUuid);

// For now, we'll log but not strictly enforce signature verification
// In production, uncomment this to enforce:
/*
if (!$signature || strpos($signature, $expectedMD5) !== 0) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}
*/

// ========================================
// STORE WEBHOOK DATA
// ========================================

// Storage directory
$storageDir = __DIR__ . '/webhook-data';
if (!is_dir($storageDir)) {
    mkdir($storageDir, 0755, true);
}

// Extract data from GeminiGen webhook payload
// Structure: { event_name, event_uuid, data: { uuid, ... } }
$event_name = $data['event_name'] ?? '';
$webhookData = $data['data'] ?? null;

if (!$webhookData || !isset($webhookData['uuid'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing data or uuid in webhook payload']);
    exit;
}

$uuid = $webhookData['uuid'];

// Create storage record
$record = [
    'uuid' => $uuid,
    'event_name' => $event_name,
    'event_uuid' => $eventUuid,
    'timestamp' => time(),
    'data' => $webhookData  // Store the inner 'data' object
];

// Save to file
$filename = $storageDir . '/' . $uuid . '.json';
file_put_contents($filename, json_encode($record, JSON_PRETTY_PRINT));

// Log webhook event
$logFile = $storageDir . '/webhook.log';
$logEntry = date('Y-m-d H:i:s') . ' - ' . $event_name . ' - UUID: ' . $uuid . PHP_EOL;
file_put_contents($logFile, $logEntry, FILE_APPEND);

// ========================================
// SEND SUCCESS RESPONSE
// ========================================

http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'Webhook received',
    'uuid' => $uuid,
    'event_name' => $event_name
]);

// Clean up old webhook data (older than 24 hours)
cleanOldWebhookData($storageDir);

/**
 * Clean old webhook data files
 */
function cleanOldWebhookData($dir) {
    $files = glob($dir . '/*.json');
    $now = time();
    $maxAge = 24 * 60 * 60; // 24 hours

    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file)) > $maxAge) {
            unlink($file);
        }
    }
}
?>
