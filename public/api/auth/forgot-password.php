<?php
/**
 * Forgot Password API Endpoint
 *
 * POST /api/auth/forgot-password.php
 *
 * Request:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "If an account exists, a password reset link has been sent."
 * }
 */

// Load dependencies
require_once __DIR__ . '/../../../app/utils/Response.php';
require_once __DIR__ . '/../../../app/models/User.php';
require_once __DIR__ . '/../../../app/services/AuthService.php';
require_once __DIR__ . '/../../../app/services/EmailService.php';

// Only allow POST
Response::requireMethod('POST');

// Get input
$input = Response::getJsonInput();

// Validate input
if (empty($input['email'])) {
    Response::validationError(['email' => 'Email is required']);
}

if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    Response::validationError(['email' => 'Invalid email format']);
}

try {
    // Find user by email
    $user = User::findByEmail(strtolower(trim($input['email'])));

    // Always return success to prevent email enumeration
    $successMessage = 'If an account with that email exists, we have sent a password reset link.';

    if (!$user) {
        // Don't reveal that user doesn't exist
        Response::success(null, 200, $successMessage);
    }

    // Check if email is verified
    if (!$user['email_verified']) {
        // Don't send reset link to unverified emails
        Response::success(null, 200, $successMessage);
    }

    // Generate reset token
    $resetToken = AuthService::generateSecureToken();

    // Save reset token with 1-hour expiry
    $saved = User::setResetToken($user['id'], $resetToken, 1);

    if (!$saved) {
        error_log("Failed to save reset token for user: " . $user['id']);
        Response::success(null, 200, $successMessage);
    }

    // Send password reset email
    $emailSent = EmailService::sendPasswordResetEmail($user['email'], $resetToken);

    if (!$emailSent) {
        error_log("Failed to send reset email to: " . $user['email']);
    }

    Response::success(null, 200, $successMessage);

} catch (Exception $e) {
    error_log('Forgot password error: ' . $e->getMessage());
    // Still return success to prevent enumeration
    Response::success(null, 200, 'If an account with that email exists, we have sent a password reset link.');
}
