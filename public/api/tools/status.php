<?php
/**
 * Generation Status API Endpoint
 *
 * GET /api/tools/status.php?uuid={request_uuid}
 * GET /api/tools/status.php (returns all pending for current user)
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "request_uuid": "...",
 *     "status": "completed|processing|pending|failed",
 *     "result_url": "...",
 *     "error_message": null
 *   }
 * }
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/models/User.php';
require_once APP_PATH . '/models/Generation.php';
require_once APP_PATH . '/services/AuthService.php';
require_once APP_PATH . '/middlewares/AuthMiddleware.php';

// Only allow GET
Response::requireMethod('GET');

// Authenticate user
$user = AuthMiddleware::authenticate();

// Get UUID parameter
$uuid = $_GET['uuid'] ?? null;

try {
    if ($uuid) {
        // Get specific generation
        $generation = Generation::findByUuid($uuid);

        if (!$generation) {
            Response::notFound('Generation not found');
        }

        // Verify ownership
        if ($generation['user_id'] !== $user['id']) {
            Response::forbidden('Access denied');
        }

        Response::success([
            'request_uuid' => $generation['request_uuid'],
            'tool_type' => $generation['tool_type'],
            'generation_type' => $generation['generation_type'],
            'model' => $generation['model'],
            'status' => $generation['status'],
            'result_url' => $generation['result_url'],
            'credits_charged' => $generation['credits_charged'],
            'error_message' => $generation['error_message'],
            'created_at' => $generation['created_at'],
            'completed_at' => $generation['completed_at']
        ]);
    } else {
        // Get all pending generations for user
        $pending = Generation::getPendingGenerations($user['id']);

        Response::success([
            'pending_count' => count($pending),
            'generations' => array_map(function ($g) {
                return [
                    'request_uuid' => $g['request_uuid'],
                    'tool_type' => $g['tool_type'],
                    'generation_type' => $g['generation_type'],
                    'model' => $g['model'],
                    'status' => $g['status'],
                    'credits_charged' => $g['credits_charged'],
                    'created_at' => $g['created_at']
                ];
            }, $pending)
        ]);
    }

} catch (Exception $e) {
    error_log('Status check error: ' . $e->getMessage());
    Response::error('Failed to check status', 500);
}
