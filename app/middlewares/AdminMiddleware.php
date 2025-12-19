<?php
/**
 * Admin Middleware
 *
 * Verifies user has admin role.
 * Use this middleware to protect admin-only endpoints.
 */

require_once __DIR__ . '/AuthMiddleware.php';

class AdminMiddleware
{
    /**
     * Check if user is authenticated AND has admin role
     * Returns user data if valid, exits with 403 if not admin
     *
     * @return array User payload from token
     */
    public static function check(): array
    {
        // First verify authentication
        $user = AuthMiddleware::check();

        // Then check admin role
        if (!isset($user['role']) || $user['role'] !== 'admin') {
            Response::forbidden('Admin access required.');
        }

        return $user;
    }

    /**
     * Log admin action
     *
     * @param int $adminId
     * @param string $actionType
     * @param int|null $targetUserId
     * @param array|null $details
     */
    public static function logAction(
        int $adminId,
        string $actionType,
        ?int $targetUserId = null,
        ?array $details = null
    ): void {
        require_once __DIR__ . '/../utils/Database.php';

        Database::execute(
            "INSERT INTO admin_actions (admin_id, action_type, target_user_id, details, ip_address)
             VALUES (?, ?, ?, ?, ?)",
            [
                $adminId,
                $actionType,
                $targetUserId,
                $details ? json_encode($details) : null,
                $_SERVER['REMOTE_ADDR'] ?? null
            ]
        );
    }
}
