<?php
/**
 * Admin Activity Log API
 *
 * GET /api/admin/activity.php - Get recent activity
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

$limit = min(50, max(1, (int) ($_GET['limit'] ?? 10)));

try {
    // Get recent admin actions
    $adminActions = Database::fetchAll(
        "SELECT
            aa.action_type,
            aa.target_user_id,
            aa.details,
            aa.created_at,
            u.email as admin_email,
            tu.email as target_email
         FROM admin_actions aa
         JOIN users u ON aa.admin_id = u.id
         LEFT JOIN users tu ON aa.target_user_id = tu.id
         ORDER BY aa.created_at DESC
         LIMIT ?",
        [$limit]
    );

    // Get recent credit transactions
    $creditTransactions = Database::fetchAll(
        "SELECT
            cl.amount,
            cl.transaction_type,
            cl.description,
            cl.created_at,
            u.email
         FROM credits_ledger cl
         JOIN users u ON cl.user_id = u.id
         WHERE cl.transaction_type IN ('signup_bonus', 'purchase', 'admin_topup')
         ORDER BY cl.created_at DESC
         LIMIT ?",
        [$limit]
    );

    // Get recent signups
    $recentSignups = Database::fetchAll(
        "SELECT email, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC LIMIT ?",
        [$limit]
    );

    // Combine and format activity
    $activity = [];

    // Admin actions
    foreach ($adminActions as $action) {
        $message = formatAdminAction($action);
        $activity[] = [
            'type' => 'admin',
            'message' => $message,
            'created_at' => $action['created_at']
        ];
    }

    // Credit transactions
    foreach ($creditTransactions as $tx) {
        $activity[] = [
            'type' => 'credit',
            'message' => formatCreditTransaction($tx),
            'created_at' => $tx['created_at']
        ];
    }

    // Signups
    foreach ($recentSignups as $signup) {
        $activity[] = [
            'type' => 'signup',
            'message' => "New user registered: {$signup['email']}",
            'created_at' => $signup['created_at']
        ];
    }

    // Sort by date
    usort($activity, function ($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });

    // Limit results
    $activity = array_slice($activity, 0, $limit);

    Response::success($activity);

} catch (Exception $e) {
    error_log('Admin activity error: ' . $e->getMessage());
    Response::error('Failed to fetch activity', 500);
}

function formatAdminAction(array $action): string
{
    $target = $action['target_email'] ?? 'unknown';
    $details = $action['details'] ? json_decode($action['details'], true) : [];

    switch ($action['action_type']) {
        case 'credit_topup':
            $amount = $details['amount'] ?? 0;
            return "Admin added {$amount} credits to {$target}";
        case 'credit_deduction':
            $amount = abs($details['amount'] ?? 0);
            return "Admin deducted {$amount} credits from {$target}";
        case 'approve_request':
            $credits = $details['credits'] ?? 0;
            return "Approved credit request for {$target} ({$credits} credits)";
        case 'reject_request':
            return "Rejected credit request for {$target}";
        case 'verify_user':
            return "Verified user {$target}";
        case 'delete_user':
            return "Deleted user {$target}";
        case 'assign_api_key':
            return "Updated API key for {$target}";
        default:
            return "Admin action: {$action['action_type']}";
    }
}

function formatCreditTransaction(array $tx): string
{
    $amount = abs($tx['amount']);

    switch ($tx['transaction_type']) {
        case 'signup_bonus':
            return "{$tx['email']} received {$amount} signup bonus credits";
        case 'purchase':
            return "{$tx['email']} purchased {$amount} credits";
        case 'admin_topup':
            return "{$tx['email']} received {$amount} credits from admin";
        default:
            return "{$tx['email']}: {$tx['description']}";
    }
}
