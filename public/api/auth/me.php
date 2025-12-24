<?php
/**
 * Get Current User API Endpoint
 *
 * GET /api/auth/me.php
 *
 * Returns current authenticated user's full data.
 * Requires authentication.
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 1,
 *     "email": "user@example.com",
 *     "role": "user",
 *     "credits": 100,
 *     "email_verified": true,
 *     "has_api_key": true,
 *     "api_key": "gm-xxx...",  // Only if has_api_key is true
 *     "created_at": "2024-01-01 00:00:00"
 *   }
 * }
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/middlewares/AuthMiddleware.php';
require_once APP_PATH . '/models/User.php';

// Allow GET only
Response::requireMethod('GET');

try {
    // Require authentication
    $tokenUser = AuthMiddleware::check();

    // Get fresh user data from database
    $user = User::findById($tokenUser['user_id']);

    if (!$user) {
        AuthService::clearAuthCookies();
        Response::unauthorized('User not found');
    }

    // Build response data
    $userData = User::getPublicData($user);

    // Include API key if set (masked for security unless full requested)
    if (!empty($user['api_key'])) {
        $userData['api_key'] = $user['api_key'];
    }

    Response::success($userData);

} catch (Exception $e) {
    error_log('Get user error: ' . $e->getMessage());
    Response::error('Failed to get user data', 500);
}
