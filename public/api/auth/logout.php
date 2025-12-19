<?php
/**
 * User Logout API Endpoint
 *
 * POST /api/auth/logout.php
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Logged out successfully"
 * }
 */

// Load dependencies
require_once __DIR__ . '/../../../app/utils/Response.php';
require_once __DIR__ . '/../../../app/services/AuthService.php';

// Only allow POST
Response::requireMethod('POST');

try {
    // Get current token
    $token = AuthService::getTokenFromCookie();

    if ($token) {
        // Invalidate session in database
        AuthService::invalidateSession($token);
    }

    // Clear cookies
    AuthService::clearAuthCookies();

    Response::success([
        'redirect' => '/login.html'
    ], 200, 'Logged out successfully');

} catch (Exception $e) {
    error_log('Logout error: ' . $e->getMessage());
    // Still clear cookies even on error
    AuthService::clearAuthCookies();
    Response::success(null, 200, 'Logged out');
}
