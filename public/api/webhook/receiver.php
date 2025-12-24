<?php
/**
 * Universal Webhook Receiver
 *
 * Single endpoint that handles webhooks for ALL tools:
 * - AI YouTube Story Generator (v2/)
 * - Script → Video
 * - Text → Video
 * - Text → Image
 *
 * Endpoint: POST /api/webhook/receiver.php
 *
 * Expected webhook payload:
 * {
 *   "event_name": "VIDEO_GENERATION_COMPLETED" | "IMAGE_GENERATION_COMPLETED" | "GENERATION_FAILED",
 *   "data": {
 *     "uuid": "request-uuid",
 *     "media_url": "https://...",
 *     "used_credit": 60000,
 *     "status_percentage": 100
 *   }
 * }
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/utils/Database.php';

// Set headers
header('Content-Type: application/json');

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::error('Method not allowed', 405);
}

// Get raw payload
$rawPayload = file_get_contents('php://input');

// Parse JSON
$payload = json_decode($rawPayload, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    logWebhook(null, null, $rawPayload, false, 'Invalid JSON payload');
    Response::error('Invalid JSON payload', 400);
}

// Extract data
$eventName = $payload['event_name'] ?? null;
$eventData = $payload['data'] ?? [];
$uuid = $eventData['uuid'] ?? null;
$mediaUrl = $eventData['media_url'] ?? null;
$usedCredit = $eventData['used_credit'] ?? null;
$statusPercentage = $eventData['status_percentage'] ?? 0;

// Validate required fields
if (!$uuid) {
    logWebhook(null, $eventName, $rawPayload, false, 'Missing UUID');
    Response::error('Missing UUID', 400);
}

// Log the webhook (for debugging)
logWebhook($uuid, $eventName, $rawPayload, false, null);

try {
    $db = Database::getInstance();

    // Determine status based on event
    $status = 'pending';
    $errorMessage = null;

    if ($statusPercentage >= 100) {
        $status = 'completed';
    } elseif ($statusPercentage > 0) {
        $status = 'processing';
    }

    // Check for failure events
    if (stripos($eventName, 'FAILED') !== false || stripos($eventName, 'ERROR') !== false) {
        $status = 'failed';
        $errorMessage = $eventData['error'] ?? $eventData['message'] ?? 'Generation failed';
    }

    // Update generation_logs table
    $stmt = $db->prepare("
        UPDATE generation_logs
        SET
            status = ?,
            result_url = ?,
            actual_credits_used = ?,
            error_message = ?,
            webhook_received = TRUE,
            completed_at = CASE WHEN ? IN ('completed', 'failed') THEN NOW() ELSE completed_at END
        WHERE request_uuid = ?
    ");

    $stmt->execute([
        $status,
        $mediaUrl,
        $usedCredit,
        $errorMessage,
        $status,
        $uuid
    ]);

    $rowsAffected = $stmt->rowCount();

    // Update webhook log as processed
    updateWebhookLog($uuid, true, null);

    // Store webhook data for frontend polling (file-based for quick access)
    storeWebhookDataForPolling($uuid, [
        'event_name' => $eventName,
        'status' => $status,
        'media_url' => $mediaUrl,
        'used_credit' => $usedCredit,
        'status_percentage' => $statusPercentage,
        'error_message' => $errorMessage,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

    // Return success
    Response::success([
        'received' => true,
        'uuid' => $uuid,
        'status' => $status,
        'rows_updated' => $rowsAffected
    ]);

} catch (Exception $e) {
    error_log('Webhook processing error: ' . $e->getMessage());
    updateWebhookLog($uuid, false, $e->getMessage());
    Response::serverError('Failed to process webhook');
}

/**
 * Log webhook to database
 */
function logWebhook(?string $uuid, ?string $eventName, string $payload, bool $processed, ?string $error): void
{
    try {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO webhook_logs (request_uuid, event_name, payload, processed, error_message)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$uuid, $eventName, $payload, $processed, $error]);
    } catch (Exception $e) {
        error_log('Failed to log webhook: ' . $e->getMessage());
    }
}

/**
 * Update webhook log status
 */
function updateWebhookLog(string $uuid, bool $processed, ?string $error): void
{
    try {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            UPDATE webhook_logs
            SET processed = ?, error_message = ?
            WHERE request_uuid = ?
            ORDER BY id DESC
            LIMIT 1
        ");
        $stmt->execute([$processed, $error, $uuid]);
    } catch (Exception $e) {
        error_log('Failed to update webhook log: ' . $e->getMessage());
    }
}

/**
 * Store webhook data for frontend polling
 * Creates a JSON file that frontend can poll for status updates
 */
function storeWebhookDataForPolling(string $uuid, array $data): void
{
    $webhookDir = __DIR__ . '/../../webhook-data/';

    // Create directory if not exists
    if (!is_dir($webhookDir)) {
        mkdir($webhookDir, 0755, true);
    }

    // Write data to file
    $filePath = $webhookDir . $uuid . '.json';
    file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));

    // Clean up old files (older than 24 hours)
    cleanupOldWebhookFiles($webhookDir);
}

/**
 * Clean up webhook files older than 24 hours
 */
function cleanupOldWebhookFiles(string $dir): void
{
    $files = glob($dir . '*.json');
    $now = time();
    $maxAge = 86400; // 24 hours

    foreach ($files as $file) {
        if ($now - filemtime($file) > $maxAge) {
            @unlink($file);
        }
    }
}
