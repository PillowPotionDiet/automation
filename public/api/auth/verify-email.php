<?php
/**
 * Email Verification API Endpoint
 *
 * POST /api/auth/verify-email.php
 *
 * Request:
 * {
 *   "token": "verification_token_here"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Email verified successfully!",
 *   "data": {
 *     "credits_added": 20
 *   }
 * }
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/models/User.php';
require_once APP_PATH . '/services/EmailService.php';

// Allow GET (from email link) and POST
Response::requireMethod(['GET', 'POST']);

// Get token from query string or POST body
$token = $_GET['token'] ?? null;

if (!$token) {
    $input = Response::getJsonInput();
    $token = $input['token'] ?? null;
}

// Validate token
if (empty($token)) {
    Response::error('Verification token is required', 400);
}

try {
    // Find user by verification token
    $user = User::findByVerificationToken($token);

    if (!$user) {
        Response::error('Invalid or expired verification token', 400);
    }

    // Check if already verified
    if ($user['email_verified']) {
        Response::success(
            ['already_verified' => true],
            200,
            'Email is already verified. You can log in now.'
        );
    }

    // Verify email and add signup bonus
    $signupBonus = 20;
    $verified = User::verifyEmail($user['id'], $signupBonus);

    if (!$verified) {
        Response::error('Failed to verify email. Please try again.', 500);
    }

    // Send welcome email
    EmailService::sendWelcomeEmail($user['email'], $signupBonus);

    Response::success([
        'credits_added' => $signupBonus,
        'redirect' => '/login.html'
    ], 200, "Email verified successfully! You've received {$signupBonus} free credits.");

} catch (Exception $e) {
    error_log('Email verification error: ' . $e->getMessage());
    Response::error('An error occurred during verification. Please try again.', 500);
}
