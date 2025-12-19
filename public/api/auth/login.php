<?php
/**
 * User Login API Endpoint
 *
 * POST /api/auth/login.php
 *
 * Request:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!",
 *   "remember": true  // optional, extends session
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": { ... }
 *   }
 * }
 */

// Load dependencies
require_once __DIR__ . '/../../../app/utils/Response.php';
require_once __DIR__ . '/../../../app/models/User.php';
require_once __DIR__ . '/../../../app/services/AuthService.php';

// Only allow POST
Response::requireMethod('POST');

// Get input
$input = Response::getJsonInput();

// Validate input
$errors = [];

if (empty($input['email'])) {
    $errors['email'] = 'Email is required';
}

if (empty($input['password'])) {
    $errors['password'] = 'Password is required';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

try {
    // Find user by email
    $user = User::findByEmail(strtolower(trim($input['email'])));

    if (!$user) {
        Response::error('Invalid email or password', 401);
    }

    // Verify password
    if (!AuthService::verifyPassword($input['password'], $user['password_hash'])) {
        Response::error('Invalid email or password', 401);
    }

    // Check email verification
    if (!$user['email_verified']) {
        Response::error('Please verify your email before logging in. Check your inbox for the verification link.', 403);
    }

    // Generate JWT token
    $tokenPayload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'credits' => $user['credits']
    ];

    // Extend session if "remember me" is checked
    $expiry = !empty($input['remember']) ? (86400 * 30) : null; // 30 days if remember
    $token = AuthService::generateToken($tokenPayload, $expiry);

    // Generate refresh token
    $refreshToken = AuthService::generateRefreshToken($user['id']);

    // Store session in database
    AuthService::createSession($user['id'], $token, $refreshToken);

    // Set cookies
    AuthService::setAuthCookie($token);
    AuthService::setAuthCookie($refreshToken, true);

    // Return user data (public only)
    $userData = User::getPublicData($user);

    Response::success([
        'user' => $userData,
        'redirect' => $user['role'] === 'admin' ? '/admin/' : '/tools/'
    ], 200, 'Login successful');

} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    Response::error('An error occurred during login. Please try again.', 500);
}
