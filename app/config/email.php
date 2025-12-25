<?php
/**
 * Email Configuration
 *
 * SMTP settings for sending verification and password reset emails.
 * Configure these values with your SMTP provider credentials.
 */

// Helper function to get env variable from multiple sources
// This handles cases where getenv() may fail with special characters
function getEnvValue(string $key, string $default = ''): string {
    // Try $_ENV first (most reliable)
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return $_ENV[$key];
    }
    // Try $_SERVER second
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }
    // Try getenv last
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }
    return $default;
}

return [
    // SMTP Configuration
    'smtp' => [
        // SMTP Host (e.g., smtp.gmail.com, smtp.hostinger.com)
        'host' => getEnvValue('SMTP_HOST', 'smtp.hostinger.com'),

        // SMTP Port (587 for TLS, 465 for SSL, 25 for unencrypted)
        'port' => (int) getEnvValue('SMTP_PORT', '465'),

        // SMTP Username (your email address)
        'username' => getEnvValue('SMTP_USER'),

        // SMTP Password
        'password' => getEnvValue('SMTP_PASS'),

        // Encryption type: 'tls', 'ssl', or '' for none
        'encryption' => getEnvValue('SMTP_ENCRYPTION', 'ssl'),
    ],

    // From email address
    'from_email' => getEnvValue('MAIL_FROM', 'noreply@automation.pillowpotion.com'),

    // From name
    'from_name' => getEnvValue('MAIL_FROM_NAME', 'AI Video Generator'),

    // Reply-to email
    'reply_to' => getEnvValue('MAIL_REPLY_TO', 'noreply@automation.pillowpotion.com'),

    // App URL for email links
    'app_url' => getEnvValue('APP_URL', 'https://automation.pillowpotion.com'),

    // Email templates path
    'templates_path' => __DIR__ . '/../templates/emails/',

    // Email subjects
    'subjects' => [
        'verification' => 'Verify Your Email - AI Video Generator',
        'password_reset' => 'Reset Your Password - AI Video Generator',
        'welcome' => 'Welcome to AI Video Generator!',
        'credit_approved' => 'Your Credit Request Has Been Approved!',
        'credit_rejected' => 'Credit Request Update'
    ],

    // Debug mode (set to true to log emails instead of sending)
    // Note: getenv returns strings, so we must compare explicitly
    'debug' => in_array(strtolower(getEnvValue('MAIL_DEBUG', 'false')), ['true', '1', 'yes'], true)
];
