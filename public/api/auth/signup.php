<?php
/**
 * User Signup API Endpoint
 *
 * POST /api/auth/signup.php
 *
 * Request:
 * {
 *   "email": "user@example.com",
 *   "password": "SecurePass123!"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Account created. Please check your email to verify."
 * }
 */

// Load dependencies
require_once __DIR__ . '/../../../app/utils/Response.php';
require_once __DIR__ . '/../../../app/utils/Validator.php';
require_once __DIR__ . '/../../../app/models/User.php';
require_once __DIR__ . '/../../../app/services/AuthService.php';
require_once __DIR__ . '/../../../app/services/EmailService.php';

// Only allow POST
Response::requireMethod('POST');

// Get input
$input = Response::getJsonInput();

// Validate input
$errors = [];

// Email validation
if (empty($input['email'])) {
    $errors['email'] = 'Email is required';
} elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Invalid email format';
} elseif (User::emailExists($input['email'])) {
    $errors['email'] = 'An account with this email already exists';
}

// Password validation
if (empty($input['password'])) {
    $errors['password'] = 'Password is required';
} elseif (strlen($input['password']) < 8) {
    $errors['password'] = 'Password must be at least 8 characters';
} elseif (!preg_match('/[A-Z]/', $input['password'])) {
    $errors['password'] = 'Password must contain at least one uppercase letter';
} elseif (!preg_match('/[a-z]/', $input['password'])) {
    $errors['password'] = 'Password must contain at least one lowercase letter';
} elseif (!preg_match('/[0-9]/', $input['password'])) {
    $errors['password'] = 'Password must contain at least one number';
}

// Return validation errors
if (!empty($errors)) {
    Response::validationError($errors);
}

try {
    // Generate verification token
    $verificationToken = AuthService::generateSecureToken();

    // Hash password
    $passwordHash = AuthService::hashPassword($input['password']);

    // Create user
    $userId = User::create([
        'email' => strtolower(trim($input['email'])),
        'password_hash' => $passwordHash,
        'verification_token' => $verificationToken
    ]);

    if (!$userId) {
        Response::error('Failed to create account. Please try again.', 500);
    }

    // Send verification email
    $emailSent = EmailService::sendVerificationEmail($input['email'], $verificationToken);

    if (!$emailSent) {
        // Log error but don't fail signup
        error_log("Failed to send verification email to: " . $input['email']);
    }

    Response::success(
        ['user_id' => $userId],
        201,
        'Account created successfully! Please check your email to verify your account.'
    );

} catch (Exception $e) {
    error_log('Signup error: ' . $e->getMessage());
    Response::error('An error occurred during signup. Please try again.', 500);
}
