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

/**
 * Mask API key for display (show first 4 and last 4 characters)
 */
function maskApiKey($apiKey) {
    if (empty($apiKey)) return null;
    $len = strlen($apiKey);
    if ($len <= 8) {
        return str_repeat('•', $len);
    }
    return substr($apiKey, 0, 4) . str_repeat('•', $len - 8) . substr($apiKey, -4);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get single user by ID
    if (isset($_GET['id'])) {
        $userId = (int) $_GET['id'];
        $user = Database::fetchOne(
            "SELECT id, email, role, credits, email_verified, api_key, created_at, updated_at,
                    (SELECT COUNT(*) FROM generation_logs WHERE user_id = users.id) as generation_count
             FROM users WHERE id = ?",
            [$userId]
        );

        if (!$user) {
            Response::notFound('User not found');
        }

        Response::success([
            'id' => (int) $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'credits' => (int) $user['credits'],
            'email_verified' => (bool) $user['email_verified'],
            'has_api_key' => !empty($user['api_key']),
            'api_key_masked' => maskApiKey($user['api_key'] ?? null),
            'generation_count' => (int) $user['generation_count'],
            'created_at' => $user['created_at'],
            'updated_at' => $user['updated_at']
        ]);
    }

    // List users
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $page = max(1, (int) ($_GET['page'] ?? 1));
    $offset = ($page - 1) * $limit;
    $search = $_GET['search'] ?? null;
    $role = $_GET['role'] ?? null;

    try {
        $where = ["1=1"];
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
        $total = (int) Database::fetchColumn(
            "SELECT COUNT(*) FROM users WHERE {$whereClause}",
            $params
        );

        // Get users
        $params[] = $limit;
        $params[] = $offset;

        $users = Database::fetchAll(
            "SELECT id, email, role, credits, email_verified, api_key, created_at, updated_at,
                    (SELECT COUNT(*) FROM generation_logs WHERE user_id = users.id) as generation_count
             FROM users
             WHERE {$whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?",
            $params
        );

        // Calculate pagination
        $totalPages = (int) ceil($total / $limit);
        $from = $total > 0 ? $offset + 1 : 0;
        $to = min($offset + $limit, $total);

        Response::success([
            'items' => array_map(function ($u) {
                return [
                    'id' => (int) $u['id'],
                    'email' => $u['email'],
                    'role' => $u['role'],
                    'credits' => (int) $u['credits'],
                    'email_verified' => (bool) $u['email_verified'],
                    'has_api_key' => !empty($u['api_key']),
                    'api_key_masked' => maskApiKey($u['api_key'] ?? null),
                    'generation_count' => (int) ($u['generation_count'] ?? 0),
                    'created_at' => $u['created_at'],
                    'updated_at' => $u['updated_at']
                ];
            }, $users),
            'pagination' => [
                'total' => $total,
                'pages' => $totalPages,
                'page' => $page,
                'limit' => $limit,
                'from' => $from,
                'to' => $to
            ]
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
    $email = $input['email'] ?? null;

    // Allow lookup by email if user_id not provided
    if (!$userId && $email) {
        $userByEmail = Database::fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
        if ($userByEmail) {
            $userId = $userByEmail['id'];
        }
    }

    if (!$userId) {
        Response::validationError(['user_id' => 'User ID or email is required']);
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

                    // Send email notification to user (only for positive credits)
                    if ($amount > 0) {
                        require_once APP_PATH . '/services/EmailService.php';
                        EmailService::sendAdminCreditAddedEmail(
                            $user['email'],
                            $amount,
                            $result['new_balance'],
                            $reason
                        );
                    }

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
                $notify = $input['notify'] ?? false;

                User::setApiKey($userId, $apiKey);

                AdminMiddleware::logAction(
                    $admin['user_id'],
                    'assign_api_key',
                    $userId,
                    ['has_key' => !empty($apiKey)]
                );

                // Send notification email if requested
                if ($notify && !empty($apiKey)) {
                    require_once APP_PATH . '/services/EmailService.php';
                    EmailService::sendApiKeyAssignedEmail($user['email'], $apiKey);
                }

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

            case 'edit':
                // Edit user details (credits, role)
                $updates = [];
                $params = [];

                // Update credits if provided
                if (isset($input['credits'])) {
                    $newCredits = (int) $input['credits'];
                    if ($newCredits < 0) {
                        Response::validationError(['credits' => 'Credits cannot be negative']);
                    }

                    // Calculate difference for logging
                    $creditDiff = $newCredits - $user['credits'];

                    $updates[] = 'credits = ?';
                    $params[] = $newCredits;
                }

                // Update role if provided (only super admins in future, for now allow)
                if (isset($input['role'])) {
                    $newRole = $input['role'];
                    if (!in_array($newRole, ['user', 'admin'])) {
                        Response::validationError(['role' => 'Invalid role']);
                    }
                    $updates[] = 'role = ?';
                    $params[] = $newRole;
                }

                if (empty($updates)) {
                    Response::error('No fields to update', 400);
                }

                // Add user ID to params
                $params[] = $userId;

                Database::execute(
                    "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?",
                    $params
                );

                AdminMiddleware::logAction(
                    $admin['user_id'],
                    'edit_user',
                    $userId,
                    ['changes' => $input]
                );

                Response::success(null, 200, 'User updated successfully');
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
