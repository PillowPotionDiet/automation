<?php
/**
 * Webhook Status Polling Endpoint
 *
 * Frontend polls this endpoint to check generation status.
 * Works for ALL tools (v2 + new tools).
 *
 * Endpoint: GET /api/webhook/status.php?uuid=xxx
 */

// Load dependencies
require_once __DIR__ . '/../../../app/utils/Database.php';
require_once __DIR__ . '/../../../app/utils/Response.php';

// Set headers
header('Content-Type: application/json');

// Only accept GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

// Get UUID from query params
$uuid = $_GET['uuid'] ?? null;

if (!$uuid) {
    Response::error('UUID is required', 400);
}

// First, try to get status from file (faster)
$webhookFile = __DIR__ . '/../../webhook-data/' . $uuid . '.json';

if (file_exists($webhookFile)) {
    $data = json_decode(file_get_contents($webhookFile), true);

    Response::success([
        'uuid' => $uuid,
        'source' => 'file',
        'status' => $data['status'] ?? 'pending',
        'media_url' => $data['media_url'] ?? null,
        'used_credit' => $data['used_credit'] ?? null,
        'status_percentage' => $data['status_percentage'] ?? 0,
        'error_message' => $data['error_message'] ?? null,
        'timestamp' => $data['timestamp'] ?? null
    ]);
}

// Fallback to database
try {
    $db = Database::getInstance();

    $stmt = $db->prepare("
        SELECT
            request_uuid,
            status,
            result_url as media_url,
            actual_credits_used as used_credit,
            error_message,
            webhook_received,
            created_at,
            completed_at
        FROM generation_logs
        WHERE request_uuid = ?
    ");

    $stmt->execute([$uuid]);
    $result = $stmt->fetch();

    if (!$result) {
        Response::notFound('Generation request not found');
    }

    // Calculate percentage based on status
    $percentage = 0;
    switch ($result['status']) {
        case 'pending':
            $percentage = 0;
            break;
        case 'processing':
            $percentage = 50;
            break;
        case 'completed':
            $percentage = 100;
            break;
        case 'failed':
            $percentage = 100;
            break;
    }

    Response::success([
        'uuid' => $uuid,
        'source' => 'database',
        'status' => $result['status'],
        'media_url' => $result['media_url'],
        'used_credit' => $result['used_credit'],
        'status_percentage' => $percentage,
        'error_message' => $result['error_message'],
        'webhook_received' => (bool) $result['webhook_received'],
        'created_at' => $result['created_at'],
        'completed_at' => $result['completed_at']
    ]);

} catch (Exception $e) {
    error_log('Webhook status check error: ' . $e->getMessage());
    Response::serverError('Failed to check status');
}
