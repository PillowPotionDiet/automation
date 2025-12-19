<?php
/**
 * Email Configuration Test with Debug
 * DELETE THIS FILE AFTER TESTING!
 */

header('Content-Type: text/html; charset=UTF-8');

// Load environment variables first
require_once __DIR__ . '/../../app/bootstrap.php';

echo "<pre style='font-family: monospace; background: #1a1a2e; color: #0f0; padding: 20px;'>";
echo "=== Email SMTP Debug Test ===\n\n";

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
    echo "Example: /public/api/test-email.php?to=test@example.com\n\n";
} else {
    echo "Sending test email to: {$testEmail}\n\n";
    echo "=== SMTP Debug Log ===\n";

    // Direct SMTP test with full debug output
    $host = $config['smtp']['host'];
    $port = $config['smtp']['port'];
    $user = $config['smtp']['username'];
    $pass = $config['smtp']['password'];
    $encryption = $config['smtp']['encryption'];
    $fromEmail = $config['from_email'];
    $fromName = $config['from_name'];

    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    echo "Connecting to ssl://{$host}:{$port}...\n";

    $socket = @stream_socket_client(
        "ssl://{$host}:{$port}",
        $errno,
        $errstr,
        30,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$socket) {
        echo "<span style='color:red'>Connection FAILED: {$errstr} ({$errno})</span>\n";
    } else {
        echo "<span style='color:#0f0'>Connected!</span>\n";

        // Read greeting
        $response = fgets($socket, 515);
        echo "Server: {$response}";

        // EHLO
        $cmd = "EHLO localhost\r\n";
        echo "Client: EHLO localhost\n";
        fwrite($socket, $cmd);
        while ($line = fgets($socket, 515)) {
            echo "Server: {$line}";
            if (substr($line, 3, 1) === ' ') break;
        }

        // AUTH LOGIN
        $cmd = "AUTH LOGIN\r\n";
        echo "Client: AUTH LOGIN\n";
        fwrite($socket, $cmd);
        $response = fgets($socket, 515);
        echo "Server: {$response}";

        // Username
        echo "Client: [username base64]\n";
        fwrite($socket, base64_encode($user) . "\r\n");
        $response = fgets($socket, 515);
        echo "Server: {$response}";

        // Password
        echo "Client: [password base64]\n";
        fwrite($socket, base64_encode($pass) . "\r\n");
        $response = fgets($socket, 515);
        echo "Server: {$response}";

        if (substr($response, 0, 3) === '235') {
            echo "<span style='color:#0f0'>Authentication SUCCESS!</span>\n";

            // MAIL FROM
            $cmd = "MAIL FROM:<{$fromEmail}>\r\n";
            echo "Client: MAIL FROM:<{$fromEmail}>\n";
            fwrite($socket, $cmd);
            $response = fgets($socket, 515);
            echo "Server: {$response}";

            // RCPT TO
            $cmd = "RCPT TO:<{$testEmail}>\r\n";
            echo "Client: RCPT TO:<{$testEmail}>\n";
            fwrite($socket, $cmd);
            $response = fgets($socket, 515);
            echo "Server: {$response}";

            // DATA
            $cmd = "DATA\r\n";
            echo "Client: DATA\n";
            fwrite($socket, $cmd);
            $response = fgets($socket, 515);
            echo "Server: {$response}";

            // Send message
            $message = "Subject: Test Email from Debug Script\r\n";
            $message .= "To: {$testEmail}\r\n";
            $message .= "From: {$fromName} <{$fromEmail}>\r\n";
            $message .= "MIME-Version: 1.0\r\n";
            $message .= "Content-Type: text/html; charset=UTF-8\r\n";
            $message .= "\r\n";
            $message .= "<h1>Test Email</h1><p>This is a debug test sent at " . date('Y-m-d H:i:s') . "</p>";
            $message .= "\r\n.\r\n";

            echo "Client: [message content]\n";
            fwrite($socket, $message);
            $response = fgets($socket, 515);
            echo "Server: {$response}";

            if (substr($response, 0, 3) === '250') {
                echo "<span style='color:#0f0'>EMAIL SENT SUCCESSFULLY!</span>\n";
            } else {
                echo "<span style='color:red'>EMAIL SEND FAILED!</span>\n";
            }

            // QUIT
            fwrite($socket, "QUIT\r\n");
        } else {
            echo "<span style='color:red'>Authentication FAILED!</span>\n";
        }

        fclose($socket);
    }
}

echo "\n=== DELETE THIS FILE AFTER TESTING ===\n";
echo "</pre>";
