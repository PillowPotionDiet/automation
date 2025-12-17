<?php
/**
 * Email Configuration
 *
 * SMTP settings for sending verification and password reset emails.
 * Configure these values with your SMTP provider credentials.
 */

return [
    // SMTP Host (e.g., smtp.gmail.com, smtp.mailgun.org)
    'host' => getenv('SMTP_HOST') ?: 'smtp.gmail.com',

    // SMTP Port (587 for TLS, 465 for SSL, 25 for unencrypted)
    'port' => getenv('SMTP_PORT') ?: 587,

    // SMTP Username (usually your email address)
    'username' => getenv('SMTP_USER') ?: '',

    // SMTP Password (app password for Gmail)
    'password' => getenv('SMTP_PASS') ?: '',

    // Encryption type: 'tls', 'ssl', or '' for none
    'encryption' => getenv('SMTP_ENCRYPTION') ?: 'tls',

    // From email address
    'from_email' => getenv('MAIL_FROM') ?: 'noreply@pillowpotion.com',

    // From name
    'from_name' => getenv('MAIL_FROM_NAME') ?: 'AI Video Generator',

    // Reply-to email
    'reply_to' => getenv('MAIL_REPLY_TO') ?: 'support@pillowpotion.com',

    // App URL for email links
    'app_url' => getenv('APP_URL') ?: 'https://automation.pillowpotion.com',

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
    'debug' => getenv('MAIL_DEBUG') ?: false
];
