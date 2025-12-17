<?php
/**
 * Database Configuration
 *
 * MySQL connection settings for the SaaS platform.
 * Update these values with your actual database credentials.
 */

return [
    // Database host (usually 'localhost' or IP address)
    'host' => getenv('DB_HOST') ?: 'localhost',

    // Database port (default MySQL port is 3306)
    'port' => getenv('DB_PORT') ?: '3306',

    // Database name
    'database' => getenv('DB_NAME') ?: 'ai_video_generator',

    // Database username
    'username' => getenv('DB_USER') ?: 'root',

    // Database password
    'password' => getenv('DB_PASS') ?: '',

    // Character set
    'charset' => 'utf8mb4',

    // Collation
    'collation' => 'utf8mb4_unicode_ci',

    // PDO options
    'options' => [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ]
];
