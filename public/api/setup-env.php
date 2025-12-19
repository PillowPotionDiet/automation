<?php
/**
 * ONE-TIME ENV SETUP SCRIPT
 * DELETE THIS FILE IMMEDIATELY AFTER RUNNING IT!
 *
 * Visit: https://automation.pillowpotion.com/api/setup-env.php
 */

// Security: Only run if .env doesn't exist
$envPath = __DIR__ . '/../../.env';

if (file_exists($envPath)) {
    die('ERROR: .env file already exists. Delete this setup script.');
}

$envContent = <<<'ENV'
DB_HOST=localhost
DB_PORT=3306
DB_NAME=u309775850_ai_video
DB_USER=u309775850_ai_video
DB_PASS=Nester547$$$

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@automation.pillowpotion.com
SMTP_PASS=Nester547$$
SMTP_ENCRYPTION=ssl

MAIL_FROM=noreply@automation.pillowpotion.com
MAIL_FROM_NAME=AI Video Generator
MAIL_REPLY_TO=noreply@automation.pillowpotion.com
MAIL_DEBUG=false

JWT_SECRET=8d595109029adbbbd99f49a3b4f99d628a737a1c9e5a674fdb99702f75e6cb4f

APP_URL=https://automation.pillowpotion.com

GEMINIGEN_API_KEY=REPLACE_WITH_YOUR_GEMINIGEN_API_KEY
ENV;

$result = file_put_contents($envPath, $envContent);

if ($result !== false) {
    echo "<pre style='background:#1a1a2e;color:#0f0;padding:20px;'>";
    echo "SUCCESS! .env file created at: {$envPath}\n\n";
    echo "IMPORTANT: DELETE THIS FILE NOW!\n";
    echo "Go to File Manager and delete: public/api/setup-env.php\n\n";
    echo "Or visit: https://automation.pillowpotion.com/api/delete-setup.php";
    echo "</pre>";
} else {
    echo "<pre style='background:#1a1a2e;color:red;padding:20px;'>";
    echo "FAILED to create .env file.\n";
    echo "Check folder permissions.";
    echo "</pre>";
}
