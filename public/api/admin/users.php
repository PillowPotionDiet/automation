<?php
/**
 * Admin Users API
 *
 * GET /api/admin/users.php - List users
 * POST /api/admin/users.php - Update user (credits, verify, etc.)
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/utils/Database.php';
require_once APP_PATH . '/models/User.php';
require_once APP_PATH . '/middlewares/AdminMiddleware.php';

// Check admin access
$admin = AdminMiddleware::check();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List users
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $offset = max(0, (int) ($_GET['offset'] ?? 0));
    $search = $_GET['search'] ?? null;
    $role = $_GET['role'] ?? null;

    try {
        $where = ["role != 'admin'"];
        $params = [];

        if ($search) {
            $where[] = "email LIKE ?";
            $params[] = "%{$search}%";
        }

        if ($role) {
            $where[] = "role = ?";
            $params[] = $role;
        }

        $whereClause = implode(' AND ', $where);

        // Get total count
        $total = Database::fetchColumn(
            "SELECT COUNT(*) FROM users WHERE {$whereClause}",
            $params
        );

        // Get users
        $params[] = $limit;
        $params[] = $offset;

        $users = Database::fetchAll(
            "SELECT id, email, role, credits, email_verified, api_key, created_at, updated_at
             FROM users
             WHERE {$whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?",
            $params
        );

        Response::success([
            'total' => (int) $total,
            'limit' => $limit,
            'offset' => $offset,
            'items' => array_map(function ($u) {
                return [
                    'id' => (int) $u['id'],
                    'email' => $u['email'],
                    'role' => $u['role'],
                    'credits' => (int) $u['credits'],
                    'email_verified' => (bool) $u['email_verified'],
                    'has_api_key' => !empty($u['api_key']),
                    'created_at' => $u['created_at'],
                    'updated_at' => $u['updated_at']
                ];
            }, $users)
        ]);

    } catch (Exception $e) {
        error_log('Admin users GET error: ' . $e->getMessage());
        Response::error('Failed to fetch users', 500);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update user
    $input = Response::getJsonInput();

    $action = $input['action'] ?? null;
    $userId = $input['user_id'] ?? null;

    if (!$userId) {
        Response::validationError(['user_id' => 'User ID is required']);
    }

    // Verify user exists
    $user = User::findById($userId);
    if (!$user) {
        Response::notFound('User not found');
    }

    try {
        switch ($action) {
            case 'add_credits':
                $amount = (int) ($input['amount'] ?? 0);
                $reason = $input['reason'] ?? 'Admin credit adjustment';

                if ($amount === 0) {
                    Response::validationError(['amount' => 'Amount must be non-zero']);
                }

                $transactionType = $amount > 0 ? 'admin_topup' : 'admin_deduction';

                $result = User::updateCredits(
                    $userId,
                    $amount,
                    $transactionType,
                    null,
                    null,
                    $reason
                );

                if ($result['success']) {
                    AdminMiddleware::logAction(
                        $admin['user_id'],
                        $amount > 0 ? 'credit_topup' : 'credit_deduction',
                        $userId,
                        ['amount' => $amount, 'reason' => $reason]
                    );

                    Response::success([
                        'new_balance' => $result['new_balance']
                    ], 200, "Credits updated. New balance: {$result['new_balance']}");
                } else {
                    Response::error($result['error'] ?? 'Failed to update credits', 400);
                }
                break;

            case 'verify':
                Database::execute(
                    "UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE id = ?",
                    [$userId]
                );

                AdminMiddleware::logAction($admin['user_id'], 'verify_user', $userId);

                Response::success(null, 200, 'User verified successfully');
                break;

            case 'set_api_key':
                $apiKey = $input['api_key'] ?? null;

                User::setApiKey($userId, $apiKey);

                AdminMiddleware::logAction(
                    $admin['user_id'],
                    'assign_api_key',
                    $userId,
                    ['has_key' => !empty($apiKey)]
                );

                Response::success(null, 200, 'API key updated');
                break;

            case 'delete':
                if ($user['role'] === 'admin') {
                    Response::forbidden('Cannot delete admin users');
                }

                User::delete($userId);

                AdminMiddleware::logAction($admin['user_id'], 'delete_user', $userId);

                Response::success(null, 200, 'User deleted');
                break;

            case 'resend_verification':
                if ($user['email_verified']) {
                    Response::error('User is already verified', 400);
                }

                // Generate new verification token
                require_once APP_PATH . '/services/AuthService.php';
                require_once APP_PATH . '/services/EmailService.php';

                $verificationToken = AuthService::generateSecureToken();

                // Update user with new token
                Database::execute(
                    "UPDATE users SET verification_token = ? WHERE id = ?",
                    [$verificationToken, $userId]
                );

                // Send verification email
                $emailSent = EmailService::sendVerificationEmail($user['email'], $verificationToken);

                if ($emailSent) {
                    Response::success(null, 200, 'Verification email sent');
                } else {
                    Response::error('Failed to send verification email', 500);
                }
                break;

            default:
                Response::validationError(['action' => 'Invalid action']);
        }

    } catch (Exception $e) {
        error_log('Admin users POST error: ' . $e->getMessage());
        Response::error('Operation failed', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}
