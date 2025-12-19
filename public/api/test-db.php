<?php
/**
 * Database Connection Test
 * DELETE THIS FILE AFTER TESTING!
 *
 * Visit: https://automation.pillowpotion.com/api/test-db.php
 */

header('Content-Type: application/json');

// Load database config
$configPath = __DIR__ . '/../../app/config/database.php';

if (!file_exists($configPath)) {
    echo json_encode(['error' => 'Config file not found']);
    exit;
}

$config = require $configPath;

echo "<pre>";
echo "=== Database Connection Test ===\n\n";

echo "Host: " . $config['host'] . "\n";
echo "Port: " . $config['port'] . "\n";
echo "Database: " . $config['database'] . "\n";
echo "Username: " . $config['username'] . "\n";
echo "Password: " . (empty($config['password']) ? '[EMPTY - NOT SET!]' : '[SET]') . "\n\n";

try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $config['host'],
        $config['port'],
        $config['database'],
        $config['charset']
    );

    $pdo = new PDO(
        $dsn,
        $config['username'],
        $config['password'],
        $config['options']
    );

    echo "CONNECTION: SUCCESS!\n\n";

    // Test if tables exist
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

    echo "Tables found: " . count($tables) . "\n";
    foreach ($tables as $table) {
        echo "  - $table\n";
    }

    if (count($tables) === 0) {
        echo "\nWARNING: No tables found! You need to import init.sql\n";
    }

    // Check for users table
    if (in_array('users', $tables)) {
        $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        echo "\nUsers in database: $userCount\n";

        // Check for admin
        $admin = $pdo->query("SELECT email FROM users WHERE role = 'admin' LIMIT 1")->fetchColumn();
        if ($admin) {
            echo "Admin account found: $admin\n";
        } else {
            echo "WARNING: No admin account found!\n";
        }
    }

} catch (PDOException $e) {
    echo "CONNECTION: FAILED!\n\n";
    echo "Error: " . $e->getMessage() . "\n\n";

    echo "Common issues:\n";
    echo "1. Wrong database name (check Hostinger prefix)\n";
    echo "2. Wrong username (check Hostinger prefix)\n";
    echo "3. Wrong password\n";
    echo "4. Database doesn't exist yet\n";
}

echo "\n=== DELETE THIS FILE AFTER TESTING ===\n";
echo "</pre>";
