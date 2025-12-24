<?php
/**
 * User Generations History API Endpoint
 *
 * GET /api/user/generations.php - Get all generations for current user
 * GET /api/user/generations.php?tool=text_to_image - Filter by tool
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "total": 25,
 *     "generations": [...]
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

// Get query parameters
$toolType = $_GET['tool'] ?? null;
$limit = min(100, max(1, (int) ($_GET['limit'] ?? 50)));
$offset = max(0, (int) ($_GET['offset'] ?? 0));

// Validate tool type if provided
$validTools = ['youtube_story', 'script_to_video', 'text_to_video', 'text_to_image'];
if ($toolType && !in_array($toolType, $validTools)) {
    Response::validationError(['tool' => 'Invalid tool type. Valid options: ' . implode(', ', $validTools)]);
}

try {
    // Get generations
    $generations = Generation::getUserGenerations($user['id'], $toolType, $limit, $offset);

    // Get total count
    $total = Generation::countUserGenerations($user['id'], $toolType);

    // Get statistics
    $stats = Generation::getUserStats($user['id']);

    Response::success([
        'total' => $total,
        'limit' => $limit,
        'offset' => $offset,
        'statistics' => $stats,
        'generations' => array_map(function ($g) {
            return [
                'id' => (int) $g['id'],
                'request_uuid' => $g['request_uuid'],
                'tool_type' => $g['tool_type'],
                'generation_type' => $g['generation_type'],
                'model' => $g['model'],
                'status' => $g['status'],
                'prompt' => $g['prompt'] ? substr($g['prompt'], 0, 200) : null,
                'result_url' => $g['result_url'],
                'credits_charged' => (int) $g['credits_charged'],
                'error_message' => $g['error_message'],
                'created_at' => $g['created_at'],
                'completed_at' => $g['completed_at']
            ];
        }, $generations)
    ]);

} catch (Exception $e) {
    error_log('Generations API error: ' . $e->getMessage());
    Response::error('Failed to fetch generations', 500);
}
