<?php
/**
 * Email Configuration Test
 * DELETE THIS FILE AFTER TESTING!
 *
 * Visit: https://automation.pillowpotion.com/public/api/test-email.php?to=your@email.com
 */

header('Content-Type: text/html; charset=UTF-8');

// Load environment variables first
require_once __DIR__ . '/../../app/bootstrap.php';

// Load configuration
require_once __DIR__ . '/../../app/services/EmailService.php';

echo "<pre style='font-family: monospace; background: #1a1a2e; color: #0f0; padding: 20px;'>";
echo "=== Email Configuration Test ===\n\n";

// Load email config
$configPath = __DIR__ . '/../../app/config/email.php';
if (!file_exists($configPath)) {
    echo "<span style='color: red;'>ERROR: Email config file not found!</span>\n";
    exit;
}

$config = require $configPath;

echo "SMTP Host: " . $config['smtp']['host'] . "\n";
echo "SMTP Port: " . $config['smtp']['port'] . "\n";
echo "SMTP User: " . $config['smtp']['username'] . "\n";
echo "SMTP Pass: " . (empty($config['smtp']['password']) ? '<span style="color: red;">[NOT SET!]</span>' : '[SET]') . "\n";
echo "Encryption: " . $config['smtp']['encryption'] . "\n";
echo "From Email: " . $config['from_email'] . "\n";
echo "From Name: " . $config['from_name'] . "\n\n";

// Check if test email requested
$testEmail = $_GET['to'] ?? null;

if (!$testEmail) {
    echo "To send a test email, add ?to=your@email.com to the URL\n";
    echo "Example: /api/test-email.php?to=test@example.com\n\n";
} else {
    echo "Sending test email to: {$testEmail}\n\n";

    try {
        $result = EmailService::send(
            $testEmail,
            'Test Email - AI Video Generator',
            '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Email Test Successful!</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <p>If you are reading this, your email configuration is working correctly!</p>
        <p><strong>Configuration:</strong></p>
        <ul>
            <li>SMTP Host: ' . $config['smtp']['host'] . '</li>
            <li>SMTP Port: ' . $config['smtp']['port'] . '</li>
            <li>Encryption: ' . $config['smtp']['encryption'] . '</li>
        </ul>
        <p style="color: #6b7280; font-size: 14px;">Sent at: ' . date('Y-m-d H:i:s') . '</p>
    </div>
</body>
</html>'
        );

        if ($result) {
            echo "<span style='color: #0f0;'>SUCCESS! Email sent to {$testEmail}</span>\n";
            echo "Check your inbox (and spam folder) for the test email.\n";
        } else {
            echo "<span style='color: red;'>FAILED! Could not send email.</span>\n";
            echo "Check your error logs for more details.\n";
        }
    } catch (Exception $e) {
        echo "<span style='color: red;'>ERROR: " . $e->getMessage() . "</span>\n";
    }
}

echo "\n=== DELETE THIS FILE AFTER TESTING ===\n";
echo "</pre>";
