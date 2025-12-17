<?php
/**
 * JWT Configuration
 *
 * Settings for JSON Web Token authentication.
 * IMPORTANT: Change the secret key in production!
 */

return [
    // JWT Secret Key - CHANGE THIS IN PRODUCTION!
    // Generate a secure key: bin2hex(random_bytes(32))
    'secret' => getenv('JWT_SECRET') ?: 'your-super-secret-key-change-in-production-minimum-32-chars',

    // Algorithm used for signing tokens
    'algorithm' => 'HS256',

    // Token expiry time in seconds (24 hours = 86400)
    'access_token_expiry' => 86400,

    // Refresh token expiry time in seconds (7 days = 604800)
    'refresh_token_expiry' => 604800,

    // Token issuer (your domain)
    'issuer' => getenv('APP_URL') ?: 'https://automation.pillowpotion.com',

    // Token audience
    'audience' => 'ai-video-generator-users',

    // Cookie settings for HttpOnly token storage
    'cookie' => [
        'name' => 'auth_token',
        'path' => '/',
        'domain' => '', // Leave empty for current domain
        'secure' => true, // Set to true in production (HTTPS)
        'httponly' => true,
        'samesite' => 'Strict'
    ],

    // Refresh token cookie settings
    'refresh_cookie' => [
        'name' => 'refresh_token',
        'path' => '/',
        'domain' => '',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict'
    ]
];
