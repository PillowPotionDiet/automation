<?php
/**
 * Email Service
 *
 * Handles sending emails via SMTP for verification, password reset, etc.
 * Uses native PHP mail functions with SMTP socket connection.
 */

class EmailService
{
    private static array $config = [];
    private static bool $configLoaded = false;

    /**
     * Load email configuration
     */
    private static function loadConfig(): void
    {
        if (!self::$configLoaded) {
            $configPath = __DIR__ . '/../config/email.php';

            if (!file_exists($configPath)) {
                throw new RuntimeException('Email configuration file not found');
            }

            self::$config = require $configPath;
            self::$configLoaded = true;
        }
    }

    /**
     * Send verification email
     *
     * @param string $toEmail
     * @param string $verificationToken
     * @return bool
     */
    public static function sendVerificationEmail(string $toEmail, string $verificationToken): bool
    {
        self::loadConfig();

        $verifyUrl = self::$config['app_url'] . '/auth/verify-email.html?token=' . $verificationToken;

        $subject = self::$config['subjects']['verification'];

        $body = self::getEmailTemplate('verification', [
            'verify_url' => $verifyUrl,
            'email' => $toEmail
        ]);

        return self::send($toEmail, $subject, $body);
    }

    /**
     * Send password reset email
     *
     * @param string $toEmail
     * @param string $resetToken
     * @return bool
     */
    public static function sendPasswordResetEmail(string $toEmail, string $resetToken): bool
    {
        self::loadConfig();

        $resetUrl = self::$config['app_url'] . '/auth/reset-password.html?token=' . $resetToken;

        $subject = self::$config['subjects']['password_reset'];

        $body = self::getEmailTemplate('password_reset', [
            'reset_url' => $resetUrl,
            'email' => $toEmail
        ]);

        return self::send($toEmail, $subject, $body);
    }

    /**
     * Send welcome email after verification
     *
     * @param string $toEmail
     * @param int $bonusCredits
     * @return bool
     */
    public static function sendWelcomeEmail(string $toEmail, int $bonusCredits = 20): bool
    {
        self::loadConfig();

        $subject = self::$config['subjects']['welcome'];
        $loginUrl = self::$config['app_url'] . '/auth/login.html';

        $body = self::getEmailTemplate('welcome', [
            'email' => $toEmail,
            'bonus_credits' => $bonusCredits,
            'login_url' => $loginUrl
        ]);

        return self::send($toEmail, $subject, $body);
    }

    /**
     * Send credit approval email
     *
     * @param string $toEmail
     * @param int $credits
     * @param string $planName
     * @return bool
     */
    public static function sendCreditApprovedEmail(string $toEmail, int $credits, string $planName): bool
    {
        self::loadConfig();

        $subject = self::$config['subjects']['credit_approved'];

        $body = self::getEmailTemplate('credit_approved', [
            'email' => $toEmail,
            'credits' => $credits,
            'plan_name' => $planName,
            'dashboard_url' => self::$config['app_url'] . '/tools/'
        ]);

        return self::send($toEmail, $subject, $body);
    }

    /**
     * Send credit rejection email
     *
     * @param string $toEmail
     * @param string $reason
     * @return bool
     */
    public static function sendCreditRejectedEmail(string $toEmail, string $reason = ''): bool
    {
        self::loadConfig();

        $subject = self::$config['subjects']['credit_rejected'];

        $body = self::getEmailTemplate('credit_rejected', [
            'email' => $toEmail,
            'reason' => $reason,
            'support_email' => self::$config['reply_to']
        ]);

        return self::send($toEmail, $subject, $body);
    }

    /**
     * Send API key assigned notification email
     *
     * @param string $toEmail
     * @param string $apiKey
     * @return bool
     */
    public static function sendApiKeyAssignedEmail(string $toEmail, string $apiKey): bool
    {
        self::loadConfig();

        $subject = "GeminiGen API Key Assigned - AI Video Generator";

        $body = self::getEmailTemplate('api_key_assigned', [
            'email' => $toEmail,
            'api_key' => $apiKey,
            'dashboard_url' => self::$config['app_url'] . '/tools/youtube-story-generator/'
        ]);

        return self::send($toEmail, $subject, $body);
    }

    /**
     * Send admin credit added notification email
     *
     * @param string $toEmail
     * @param int $credits
     * @param int $newBalance
     * @param string $reason
     * @return bool
     */
    public static function sendAdminCreditAddedEmail(string $toEmail, int $credits, int $newBalance, string $reason = ''): bool
    {
        self::loadConfig();

        $subject = "Credits Added to Your Account - AI Video Generator";

        $body = self::getEmailTemplate('admin_credit_added', [
            'email' => $toEmail,
            'credits' => $credits,
            'new_balance' => $newBalance,
            'reason' => $reason ?: 'Admin credit adjustment',
            'dashboard_url' => self::$config['app_url'] . '/tools/'
        ]);

        return self::send($toEmail, $subject, $body);
    }

    /**
     * Send email using SMTP
     *
     * @param string $to
     * @param string $subject
     * @param string $body
     * @return bool
     */
    public static function send(string $to, string $subject, string $body): bool
    {
        self::loadConfig();

        // Debug mode - log instead of send
        if (self::$config['debug']) {
            error_log("EMAIL DEBUG - To: {$to}, Subject: {$subject}");
            error_log("EMAIL DEBUG - Body: " . substr($body, 0, 500));
            return true;
        }

        try {
            return self::sendViaSMTP($to, $subject, $body);
        } catch (Exception $e) {
            error_log("Email send error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send email via SMTP socket connection
     *
     * @param string $to
     * @param string $subject
     * @param string $body
     * @return bool
     */
    private static function sendViaSMTP(string $to, string $subject, string $body): bool
    {
        $host = self::$config['smtp']['host'];
        $port = self::$config['smtp']['port'];
        $user = self::$config['smtp']['username'];
        $pass = self::$config['smtp']['password'];
        $encryption = self::$config['smtp']['encryption'];

        $fromEmail = self::$config['from_email'];
        $fromName = self::$config['from_name'];

        // Build email content
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$fromName} <{$fromEmail}>\r\n";
        $headers .= "Reply-To: " . self::$config['reply_to'] . "\r\n";
        $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

        // Connect to SMTP server
        $context = stream_context_create([
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false,
                'allow_self_signed' => true
            ]
        ]);

        // For SSL (port 465), use ssl:// prefix
        // For TLS (port 587), connect without prefix then use STARTTLS
        if ($encryption === 'ssl') {
            $socket = stream_socket_client(
                "ssl://{$host}:{$port}",
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT,
                $context
            );
        } else {
            $socket = stream_socket_client(
                "tcp://{$host}:{$port}",
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT,
                $context
            );
        }

        if (!$socket) {
            error_log("SMTP Connection failed: {$errstr} ({$errno})");
            return false;
        }

        // Read greeting
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '220') {
            error_log("SMTP Error: {$response}");
            fclose($socket);
            return false;
        }

        // EHLO
        fwrite($socket, "EHLO " . gethostname() . "\r\n");
        $response = self::getSmtpResponse($socket);

        // STARTTLS for TLS encryption
        if ($encryption === 'tls') {
            fwrite($socket, "STARTTLS\r\n");
            $response = fgets($socket, 515);
            if (substr($response, 0, 3) !== '220') {
                error_log("SMTP STARTTLS failed: {$response}");
                fclose($socket);
                return false;
            }

            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);

            fwrite($socket, "EHLO " . gethostname() . "\r\n");
            $response = self::getSmtpResponse($socket);
        }

        // AUTH LOGIN
        fwrite($socket, "AUTH LOGIN\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '334') {
            error_log("SMTP AUTH failed: {$response}");
            fclose($socket);
            return false;
        }

        // Send username
        fwrite($socket, base64_encode($user) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '334') {
            error_log("SMTP username rejected: {$response}");
            fclose($socket);
            return false;
        }

        // Send password
        fwrite($socket, base64_encode($pass) . "\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '235') {
            error_log("SMTP authentication failed: {$response}");
            fclose($socket);
            return false;
        }

        // MAIL FROM
        fwrite($socket, "MAIL FROM:<{$fromEmail}>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '250') {
            error_log("SMTP MAIL FROM failed: {$response}");
            fclose($socket);
            return false;
        }

        // RCPT TO
        fwrite($socket, "RCPT TO:<{$to}>\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '250') {
            error_log("SMTP RCPT TO failed: {$response}");
            fclose($socket);
            return false;
        }

        // DATA
        fwrite($socket, "DATA\r\n");
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '354') {
            error_log("SMTP DATA failed: {$response}");
            fclose($socket);
            return false;
        }

        // Send email content
        $message = "Subject: {$subject}\r\n";
        $message .= "To: {$to}\r\n";
        $message .= $headers;
        $message .= "\r\n";
        $message .= $body;
        $message .= "\r\n.\r\n";

        fwrite($socket, $message);
        $response = fgets($socket, 515);
        if (substr($response, 0, 3) !== '250') {
            error_log("SMTP message sending failed: {$response}");
            fclose($socket);
            return false;
        }

        // QUIT
        fwrite($socket, "QUIT\r\n");
        fclose($socket);

        error_log("Email sent successfully to: {$to}");
        return true;
    }

    /**
     * Get full SMTP response (may be multiline)
     *
     * @param resource $socket
     * @return string
     */
    private static function getSmtpResponse($socket): string
    {
        $response = '';
        while ($line = fgets($socket, 515)) {
            $response .= $line;
            if (substr($line, 3, 1) === ' ') {
                break;
            }
        }
        return $response;
    }

    /**
     * Get email template with variable replacement
     *
     * @param string $templateName
     * @param array $variables
     * @return string
     */
    private static function getEmailTemplate(string $templateName, array $variables = []): string
    {
        // Check for custom template file
        $templatePath = self::$config['templates_path'] . $templateName . '.html';

        if (file_exists($templatePath)) {
            $template = file_get_contents($templatePath);
        } else {
            // Use built-in templates
            $template = self::getBuiltInTemplate($templateName);
        }

        // Replace variables
        foreach ($variables as $key => $value) {
            $template = str_replace('{{' . $key . '}}', htmlspecialchars($value), $template);
        }

        return $template;
    }

    /**
     * Get built-in email template
     *
     * @param string $name
     * @return string
     */
    private static function getBuiltInTemplate(string $name): string
    {
        $templates = [
            'verification' => '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">AI Video Generator</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Verify Your Email</h2>
        <p>Thanks for signing up! Please verify your email address to get started.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{verify_url}}" style="background: #6366f1; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Verify Email</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">If you did not create an account, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">If the button does not work, copy and paste this link:<br>{{verify_url}}</p>
    </div>
</body>
</html>',

            'password_reset' => '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">AI Video Generator</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Reset Your Password</h2>
        <p>We received a request to reset your password. Click the button below to create a new password.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{reset_url}}" style="background: #6366f1; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Reset Password</a>
        </p>
        <p style="color: #ef4444; font-size: 14px;"><strong>This link expires in 1 hour.</strong></p>
        <p style="color: #6b7280; font-size: 14px;">If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">If the button does not work, copy and paste this link:<br>{{reset_url}}</p>
    </div>
</body>
</html>',

            'welcome' => '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome!</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Your Account is Ready!</h2>
        <p>Your email has been verified successfully. As a welcome gift, we have added <strong style="color: #6366f1;">{{bonus_credits}} free credits</strong> to your account!</p>
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #059669; font-size: 24px; font-weight: bold;">{{bonus_credits}} Credits Added!</p>
        </div>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{login_url}}" style="background: #6366f1; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Start Creating</a>
        </p>
        <p>With your credits, you can:</p>
        <ul style="color: #4b5563;">
            <li>Generate AI images and videos</li>
            <li>Create YouTube story videos</li>
            <li>Transform text into visual content</li>
        </ul>
    </div>
</body>
</html>',

            'credit_approved' => '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Credits Added!</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Your Credit Request Has Been Approved</h2>
        <p>Great news! Your credit purchase request has been approved.</p>
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #6b7280;">{{plan_name}}</p>
            <p style="margin: 10px 0 0; color: #059669; font-size: 32px; font-weight: bold;">+{{credits}} Credits</p>
        </div>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{dashboard_url}}" style="background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Go to Dashboard</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Thank you for your purchase!</p>
    </div>
</body>
</html>',

            'credit_rejected' => '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Credit Request Update</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Request Could Not Be Processed</h2>
        <p>Unfortunately, we were unable to process your credit purchase request at this time.</p>
        <p><strong>Reason:</strong> {{reason}}</p>
        <p>If you believe this is an error or need assistance, please contact our support team.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="mailto:{{support_email}}" style="background: #6366f1; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Contact Support</a>
        </p>
    </div>
</body>
</html>',

            'admin_credit_added' => '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Credits Added!</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">You Have Received Credits</h2>
        <p>Great news! Credits have been added to your account.</p>
        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #059669; font-size: 32px; font-weight: bold;">+{{credits}} Credits</p>
            <p style="margin: 10px 0 0; color: #6b7280; font-size: 14px;">New Balance: {{new_balance}} credits</p>
        </div>
        <p style="color: #4b5563;"><strong>Reason:</strong> {{reason}}</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{dashboard_url}}" style="background: #10b981; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Go to Dashboard</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">Use your credits to generate amazing AI images and videos!</p>
    </div>
</body>
</html>',

            'api_key_assigned' => '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">API Key Assigned!</h1>
    </div>
    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937;">Your GeminiGen API Key is Ready</h2>
        <p>Great news! A GeminiGen API key has been assigned to your account. You can now use the AI YouTube Story Generator tool.</p>
        <div style="background: #f0f9ff; border: 1px solid #6366f1; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">Your API Key:</p>
            <p style="margin: 0; color: #1f2937; font-size: 14px; font-family: monospace; word-break: break-all; background: #e0e7ff; padding: 12px; border-radius: 6px;">{{api_key}}</p>
        </div>
        <p style="color: #ef4444; font-size: 14px;"><strong>Important:</strong> Keep this API key secure and do not share it with anyone.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="{{dashboard_url}}" style="background: #6366f1; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Start Creating Videos</a>
        </p>
        <p style="color: #6b7280; font-size: 14px;">The API key is already saved in your account settings. Just visit the YouTube Story Generator to start creating!</p>
    </div>
</body>
</html>'
        ];

        return $templates[$name] ?? '<p>Email template not found.</p>';
    }
}
