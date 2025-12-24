<?php
/**
 * User Credits API Endpoint
 *
 * GET /api/user/credits.php - Get current credits balance and history
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "balance": 150,
 *     "history": [...]
 *   }
 * }
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/utils/Database.php';
require_once APP_PATH . '/models/User.php';
require_once APP_PATH . '/services/AuthService.php';
require_once APP_PATH . '/middlewares/AuthMiddleware.php';

// Only allow GET
Response::requireMethod('GET');

// Authenticate user
$user = AuthMiddleware::authenticate();

try {
    // Get current balance
    $balance = User::getCredits($user['id']);

    // Get credit history (last 50 transactions)
    $history = Database::fetchAll(
        "SELECT
            amount,
            balance_after,
            transaction_type,
            reference_id,
            model_used,
            tool_type,
            description,
            created_at
         FROM credits_ledger
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 50",
        [$user['id']]
    );

    // Get statistics
    $stats = Database::fetchOne(
        "SELECT
            SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
            SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
            COUNT(*) as total_transactions
         FROM credits_ledger
         WHERE user_id = ?",
        [$user['id']]
    );

    Response::success([
        'balance' => $balance,
        'statistics' => [
            'total_earned' => (int) ($stats['total_earned'] ?? 0),
            'total_spent' => (int) ($stats['total_spent'] ?? 0),
            'total_transactions' => (int) ($stats['total_transactions'] ?? 0)
        ],
        'history' => array_map(function ($item) {
            return [
                'amount' => (int) $item['amount'],
                'balance_after' => (int) $item['balance_after'],
                'type' => $item['transaction_type'],
                'reference_id' => $item['reference_id'],
                'model' => $item['model_used'],
                'tool' => $item['tool_type'],
                'description' => $item['description'],
                'date' => $item['created_at']
            ];
        }, $history)
    ]);

} catch (Exception $e) {
    error_log('Credits API error: ' . $e->getMessage());
    Response::error('Failed to fetch credits', 500);
}
