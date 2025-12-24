<?php
/**
 * Auth Check API Endpoint
 *
 * GET /api/auth/check.php
 *
 * Checks if user is currently authenticated.
 * Used by frontend to determine auth state.
 *
 * Response (authenticated):
 * {
 *   "success": true,
 *   "data": {
 *     "authenticated": true,
 *     "user": { ... }
 *   }
 * }
 *
 * Response (not authenticated):
 * {
 *   "success": true,
 *   "data": {
 *     "authenticated": false
 *   }
 * }
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/services/AuthService.php';
require_once APP_PATH . '/models/User.php';

// Allow GET only
Response::requireMethod('GET');

try {
    // Get token from cookie
    $token = AuthService::getTokenFromCookie();

    if (!$token) {
        Response::success([
            'authenticated' => false
        ]);
    }

    // Verify token
    $payload = AuthService::verifyToken($token);

    if (!$payload) {
        // Clear invalid cookies
        AuthService::clearAuthCookies();
        Response::success([
            'authenticated' => false
        ]);
    }

    // Get fresh user data from database
    $user = User::findById($payload['user_id']);

    if (!$user) {
        AuthService::clearAuthCookies();
        Response::success([
            'authenticated' => false
        ]);
    }

    // Return authenticated user data
    Response::success([
        'authenticated' => true,
        'user' => User::getPublicData($user)
    ]);

} catch (Exception $e) {
    error_log('Auth check error: ' . $e->getMessage());
    Response::success([
        'authenticated' => false
    ]);
}
