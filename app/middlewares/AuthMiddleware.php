<?php
/**
 * Authentication Middleware
 *
 * Verifies JWT tokens and ensures user is authenticated.
 * Use this middleware to protect API endpoints.
 */

require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/Response.php';

class AuthMiddleware
{
    /**
     * Check if user is authenticated
     * Returns user data if valid, exits with 401 if not
     *
     * @return array User payload from token
     */
    public static function check(): array
    {
        // Get token from cookie
        $token = AuthService::getTokenFromCookie();

        if (!$token) {
            Response::unauthorized('Authentication required. Please log in.');
        }

        // Verify token
        $payload = AuthService::verifyToken($token);

        if (!$payload) {
            // Clear invalid cookies
            AuthService::clearAuthCookies();
            Response::unauthorized('Session expired. Please log in again.');
        }

        // Optionally verify session in database (for session invalidation)
        // Uncomment if you want strict session control
        // if (!AuthService::isSessionValid($token)) {
        //     AuthService::clearAuthCookies();
        //     Response::unauthorized('Session has been invalidated.');
        // }

        return $payload;
    }

    /**
     * Check authentication and return user or null (non-blocking)
     *
     * @return array|null User payload or null if not authenticated
     */
    public static function checkOptional(): ?array
    {
        $token = AuthService::getTokenFromCookie();

        if (!$token) {
            return null;
        }

        return AuthService::verifyToken($token);
    }

    /**
     * Require email verification
     * Call after check() to ensure email is verified
     *
     * @param array $user User payload from check()
     */
    public static function requireEmailVerified(array $user): void
    {
        // Fetch fresh user data from database
        $userData = User::findById($user['user_id']);

        if (!$userData || !$userData['email_verified']) {
            Response::error('Please verify your email address before accessing this resource.', 403);
        }
    }

    /**
     * Get full user data from database
     * Useful when you need fresh data (credits, etc.)
     *
     * @param array $tokenPayload Payload from check()
     * @return array Full user record
     */
    public static function getFullUser(array $tokenPayload): array
    {
        $user = User::findById($tokenPayload['user_id']);

        if (!$user) {
            AuthService::clearAuthCookies();
            Response::unauthorized('User account not found.');
        }

        return $user;
    }

    /**
     * Refresh user data in response
     * Useful after operations that change user state
     *
     * @param int $userId
     * @return array Public user data
     */
    public static function refreshUserData(int $userId): array
    {
        $user = User::findById($userId);

        if (!$user) {
            return [];
        }

        return User::getPublicData($user);
    }
}
