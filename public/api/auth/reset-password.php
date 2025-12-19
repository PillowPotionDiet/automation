<?php
/**
 * Reset Password API Endpoint
 *
 * POST /api/auth/reset-password.php
 *
 * Request:
 * {
 *   "token": "reset_token_here",
 *   "password": "NewSecurePass123!",
 *   "password_confirm": "NewSecurePass123!"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Password reset successfully. You can now log in."
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

if (empty($input['token'])) {
    $errors['token'] = 'Reset token is required';
}

if (empty($input['password'])) {
    $errors['password'] = 'New password is required';
} elseif (strlen($input['password']) < 8) {
    $errors['password'] = 'Password must be at least 8 characters';
} elseif (!preg_match('/[A-Z]/', $input['password'])) {
    $errors['password'] = 'Password must contain at least one uppercase letter';
} elseif (!preg_match('/[a-z]/', $input['password'])) {
    $errors['password'] = 'Password must contain at least one lowercase letter';
} elseif (!preg_match('/[0-9]/', $input['password'])) {
    $errors['password'] = 'Password must contain at least one number';
}

if (empty($input['password_confirm'])) {
    $errors['password_confirm'] = 'Please confirm your password';
} elseif ($input['password'] !== $input['password_confirm']) {
    $errors['password_confirm'] = 'Passwords do not match';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

try {
    // Find user by reset token (also checks expiry)
    $user = User::findByResetToken($input['token']);

    if (!$user) {
        Response::error('Invalid or expired reset token. Please request a new password reset.', 400);
    }

    // Hash new password
    $passwordHash = AuthService::hashPassword($input['password']);

    // Update password and clear reset token
    $updated = User::resetPassword($user['id'], $passwordHash);

    if (!$updated) {
        Response::error('Failed to reset password. Please try again.', 500);
    }

    // Invalidate all existing sessions for security
    AuthService::invalidateAllSessions($user['id']);

    Response::success([
        'redirect' => '/login.html'
    ], 200, 'Password reset successfully! You can now log in with your new password.');

} catch (Exception $e) {
    error_log('Password reset error: ' . $e->getMessage());
    Response::error('An error occurred. Please try again.', 500);
}
