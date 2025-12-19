<?php
/**
 * Resend Verification Email API Endpoint
 *
 * POST /api/auth/resend-verification.php
 *
 * Request:
 * {
 *   "email": "user@example.com"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Verification email sent"
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

    // Generic success message to prevent email enumeration
    $successMessage = 'If the email exists and is not verified, a new verification link has been sent.';

    if (!$user) {
        Response::success(null, 200, $successMessage);
    }

    // Check if already verified
    if ($user['email_verified']) {
        Response::success(null, 200, 'This email is already verified. You can log in now.');
    }

    // Generate new verification token
    $verificationToken = AuthService::generateSecureToken();

    // Update user with new token
    require_once __DIR__ . '/../../../app/utils/Database.php';
    Database::execute(
        "UPDATE users SET verification_token = ? WHERE id = ?",
        [$verificationToken, $user['id']]
    );

    // Send verification email
    $emailSent = EmailService::sendVerificationEmail($user['email'], $verificationToken);

    if (!$emailSent) {
        error_log("Failed to resend verification email to: " . $user['email']);
    }

    Response::success(null, 200, $successMessage);

} catch (Exception $e) {
    error_log('Resend verification error: ' . $e->getMessage());
    Response::success(null, 200, 'If the email exists and is not verified, a new verification link has been sent.');
}
