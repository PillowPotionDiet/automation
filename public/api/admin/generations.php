<?php
/**
 * Admin Generations API
 *
 * GET /api/admin/generations.php - List all generations
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/utils/Database.php';
require_once APP_PATH . '/middlewares/AdminMiddleware.php';

// Only allow GET
Response::requireMethod('GET');

// Check admin access
AdminMiddleware::check();

$limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
$offset = max(0, (int) ($_GET['offset'] ?? 0));
$toolType = $_GET['tool'] ?? null;
$status = $_GET['status'] ?? null;
$userId = $_GET['user_id'] ?? null;

try {
    $where = ['1=1'];
    $params = [];

    if ($toolType) {
        $where[] = "gl.tool_type = ?";
        $params[] = $toolType;
    }

    if ($status) {
        $where[] = "gl.status = ?";
        $params[] = $status;
    }

    if ($userId) {
        $where[] = "gl.user_id = ?";
        $params[] = $userId;
    }

    $whereClause = implode(' AND ', $where);

    // Get total count
    $total = Database::fetchColumn(
        "SELECT COUNT(*) FROM generation_logs gl WHERE {$whereClause}",
        $params
    );

    // Get generations
    $params[] = $limit;
    $params[] = $offset;

    $generations = Database::fetchAll(
        "SELECT
            gl.id,
            gl.user_id,
            u.email,
            gl.tool_type,
            gl.generation_type,
            gl.model,
            gl.credits_charged,
            gl.actual_credits_used,
            gl.request_uuid,
            gl.prompt,
            gl.result_url,
            gl.status,
            gl.error_message,
            gl.created_at,
            gl.completed_at
         FROM generation_logs gl
         JOIN users u ON gl.user_id = u.id
         WHERE {$whereClause}
         ORDER BY gl.created_at DESC
         LIMIT ? OFFSET ?",
        $params
    );

    // Get statistics
    $stats = Database::fetchOne(
        "SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
            SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
            SUM(credits_charged) as total_credits
         FROM generation_logs gl
         WHERE {$whereClause}",
        array_slice($params, 0, -2) // Remove limit/offset params
    );

    Response::success([
        'total' => (int) $total,
        'limit' => $limit,
        'offset' => $offset,
        'statistics' => [
            'total' => (int) ($stats['total'] ?? 0),
            'completed' => (int) ($stats['completed'] ?? 0),
            'failed' => (int) ($stats['failed'] ?? 0),
            'processing' => (int) ($stats['processing'] ?? 0),
            'total_credits' => (int) ($stats['total_credits'] ?? 0)
        ],
        'items' => array_map(function ($g) {
            return [
                'id' => (int) $g['id'],
                'user_id' => (int) $g['user_id'],
                'email' => $g['email'],
                'tool_type' => $g['tool_type'],
                'generation_type' => $g['generation_type'],
                'model' => $g['model'],
                'credits_charged' => (int) $g['credits_charged'],
                'actual_credits_used' => $g['actual_credits_used'] ? (int) $g['actual_credits_used'] : null,
                'request_uuid' => $g['request_uuid'],
                'prompt' => $g['prompt'] ? substr($g['prompt'], 0, 200) : null,
                'result_url' => $g['result_url'],
                'status' => $g['status'],
                'error_message' => $g['error_message'],
                'created_at' => $g['created_at'],
                'completed_at' => $g['completed_at']
            ];
        }, $generations)
    ]);

} catch (Exception $e) {
    error_log('Admin generations error: ' . $e->getMessage());
    Response::error('Failed to fetch generations', 500);
}
