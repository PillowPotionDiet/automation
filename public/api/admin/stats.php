<?php
/**
 * Admin Dashboard Statistics API
 *
 * GET /api/admin/stats.php - Get dashboard statistics
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/utils/Database.php';
require_once APP_PATH . '/middlewares/AdminMiddleware.php';

// Only allow GET
Response::requireMethod('GET');

// Check admin access
$admin = AdminMiddleware::check();

try {
    // Get basic stats
    $stats = Database::fetchOne("
        SELECT
            (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
            (SELECT COUNT(*) FROM users WHERE role = 'user' AND email_verified = TRUE) as verified_users,
            (SELECT SUM(credits) FROM users WHERE role = 'user') as total_credits,
            (SELECT COUNT(*) FROM credit_requests WHERE status = 'pending') as pending_requests,
            (SELECT COUNT(*) FROM generation_logs WHERE DATE(created_at) = CURDATE()) as generations_today,
            (SELECT COALESCE(SUM(credits_charged), 0) FROM generation_logs WHERE DATE(created_at) = CURDATE()) as credits_today,
            (SELECT COUNT(*) FROM generation_logs) as total_generations
    ");

    // Get new users this week
    $newUsersWeek = Database::fetchColumn(
        "SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    );

    // Get credits distributed this week
    $creditsWeek = Database::fetchColumn(
        "SELECT COALESCE(SUM(amount), 0) FROM credits_ledger
         WHERE amount > 0 AND transaction_type IN ('signup_bonus', 'purchase', 'admin_topup')
         AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)"
    );

    Response::success([
        'total_users' => (int) ($stats['total_users'] ?? 0),
        'verified_users' => (int) ($stats['verified_users'] ?? 0),
        'total_credits' => (int) ($stats['total_credits'] ?? 0),
        'pending_requests' => (int) ($stats['pending_requests'] ?? 0),
        'generations_today' => (int) ($stats['generations_today'] ?? 0),
        'credits_today' => (int) ($stats['credits_today'] ?? 0),
        'total_generations' => (int) ($stats['total_generations'] ?? 0),
        'new_users_week' => (int) $newUsersWeek,
        'credits_distributed_week' => (int) $creditsWeek
    ]);

} catch (Exception $e) {
    error_log('Admin stats error: ' . $e->getMessage());
    Response::error('Failed to fetch statistics', 500);
}
