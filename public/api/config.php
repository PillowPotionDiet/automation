<?php
/**
 * API Configuration
 * Determines the correct path to the app folder based on environment
 *
 * Supports:
 * - Hostinger via GitHub: automation.pillowpotion.com/public/api/ -> app is at /../../../app
 * - Local development: localhost/public/api/ -> app is at /../../../app
 * - Direct public_html deployment: site.com/api/ -> app is at /../../app
 */

// Try to find the app folder (check multiple possible locations)
// From public/api/config.php: ../../app goes to project root's app folder
$possiblePaths = [
    __DIR__ . '/../../app',           // GitHub deploy: public/api -> ../../app (MAIN)
    __DIR__ . '/../../../app',        // Alternative: in case of deeper nesting
    dirname($_SERVER['DOCUMENT_ROOT']) . '/app',  // Above document root
];

$appPath = null;
foreach ($possiblePaths as $path) {
    if (is_dir($path)) {
        $appPath = realpath($path);
        break;
    }
}

if (!$appPath) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => 'Configuration error: app folder not found. Checked paths: ' . implode(', ', $possiblePaths)
    ]);
    exit;
}

// Define the app path constant
define('APP_PATH', $appPath);

// Load core dependencies
require_once APP_PATH . '/bootstrap.php';
require_once APP_PATH . '/utils/Response.php';
