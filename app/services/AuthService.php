<?php
/**
 * Authentication Service
 *
 * Handles JWT token generation, validation, and cookie management.
 * Uses HMAC-SHA256 for token signing.
 */

require_once __DIR__ . '/../utils/Database.php';

class AuthService
{
    private static array $config = [];
    private static bool $configLoaded = false;

    /**
     * Load JWT configuration
     */
    private static function loadConfig(): void
    {
        if (!self::$configLoaded) {
            $configPath = __DIR__ . '/../config/jwt.php';

            if (!file_exists($configPath)) {
                throw new RuntimeException('JWT configuration file not found');
            }

            self::$config = require $configPath;
            self::$configLoaded = true;
        }
    }

    /**
     * Generate a JWT token
     *
     * @param array $payload Data to encode in token
     * @param int|null $expiry Custom expiry time in seconds
     * @return string JWT token
     */
    public static function generateToken(array $payload, ?int $expiry = null): string
    {
        self::loadConfig();

        $expiry = $expiry ?? self::$config['access_token_expiry'];

        $header = [
            'typ' => 'JWT',
            'alg' => self::$config['algorithm']
        ];

        $payload['iss'] = self::$config['issuer'];
        $payload['aud'] = self::$config['audience'];
        $payload['iat'] = time();
        $payload['exp'] = time() + $expiry;

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = self::sign("{$headerEncoded}.{$payloadEncoded}");
        $signatureEncoded = self::base64UrlEncode($signature);

        return "{$headerEncoded}.{$payloadEncoded}.{$signatureEncoded}";
    }

    /**
     * Generate a refresh token
     *
     * @param int $userId
     * @return string Refresh token
     */
    public static function generateRefreshToken(int $userId): string
    {
        self::loadConfig();

        return self::generateToken(
            ['user_id' => $userId, 'type' => 'refresh'],
            self::$config['refresh_token_expiry']
        );
    }

    /**
     * Verify and decode a JWT token
     *
     * @param string $token
     * @return array|null Decoded payload or null if invalid
     */
    public static function verifyToken(string $token): ?array
    {
        self::loadConfig();

        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        // Verify signature
        $expectedSignature = self::sign("{$headerEncoded}.{$payloadEncoded}");
        $actualSignature = self::base64UrlDecode($signatureEncoded);

        if (!hash_equals($expectedSignature, $actualSignature)) {
            return null;
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

        if (!$payload) {
            return null;
        }

        // Check expiry
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null;
        }

        // Check issuer
        if (isset($payload['iss']) && $payload['iss'] !== self::$config['issuer']) {
            return null;
        }

        return $payload;
    }

    /**
     * Set authentication cookie
     *
     * @param string $token JWT token
     * @param bool $isRefresh Whether this is a refresh token
     */
    public static function setAuthCookie(string $token, bool $isRefresh = false): void
    {
        self::loadConfig();

        $cookieConfig = $isRefresh ? self::$config['refresh_cookie'] : self::$config['cookie'];
        $expiry = $isRefresh ? self::$config['refresh_token_expiry'] : self::$config['access_token_expiry'];

        $options = [
            'expires' => time() + $expiry,
            'path' => $cookieConfig['path'],
            'domain' => $cookieConfig['domain'],
            'secure' => $cookieConfig['secure'],
            'httponly' => $cookieConfig['httponly'],
            'samesite' => $cookieConfig['samesite']
        ];

        setcookie($cookieConfig['name'], $token, $options);
    }

    /**
     * Clear authentication cookies
     */
    public static function clearAuthCookies(): void
    {
        self::loadConfig();

        $options = [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict'
        ];

        setcookie(self::$config['cookie']['name'], '', $options);
        setcookie(self::$config['refresh_cookie']['name'], '', $options);
    }

    /**
     * Get token from cookie
     *
     * @param bool $isRefresh Get refresh token instead
     * @return string|null
     */
    public static function getTokenFromCookie(bool $isRefresh = false): ?string
    {
        self::loadConfig();

        $cookieName = $isRefresh
            ? self::$config['refresh_cookie']['name']
            : self::$config['cookie']['name'];

        return $_COOKIE[$cookieName] ?? null;
    }

    /**
     * Get current authenticated user from request
     *
     * @return array|null User payload from token
     */
    public static function getCurrentUser(): ?array
    {
        $token = self::getTokenFromCookie();

        if (!$token) {
            return null;
        }

        return self::verifyToken($token);
    }

    /**
     * Create session in database
     *
     * @param int $userId
     * @param string $token
     * @param string|null $refreshToken
     * @return bool
     */
    public static function createSession(int $userId, string $token, ?string $refreshToken = null): bool
    {
        self::loadConfig();

        $tokenHash = hash('sha256', $token);
        $refreshHash = $refreshToken ? hash('sha256', $refreshToken) : null;
        $expiry = date('Y-m-d H:i:s', time() + self::$config['access_token_expiry']);

        return Database::execute(
            "INSERT INTO user_sessions (user_id, token_hash, refresh_token_hash, expires_at, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?)",
            [
                $userId,
                $tokenHash,
                $refreshHash,
                $expiry,
                $_SERVER['REMOTE_ADDR'] ?? null,
                $_SERVER['HTTP_USER_AGENT'] ?? null
            ]
        ) > 0;
    }

    /**
     * Invalidate all user sessions
     *
     * @param int $userId
     * @return bool
     */
    public static function invalidateAllSessions(int $userId): bool
    {
        return Database::execute(
            "DELETE FROM user_sessions WHERE user_id = ?",
            [$userId]
        ) >= 0;
    }

    /**
     * Invalidate specific session by token
     *
     * @param string $token
     * @return bool
     */
    public static function invalidateSession(string $token): bool
    {
        $tokenHash = hash('sha256', $token);

        return Database::execute(
            "DELETE FROM user_sessions WHERE token_hash = ?",
            [$tokenHash]
        ) > 0;
    }

    /**
     * Check if session is valid in database
     *
     * @param string $token
     * @return bool
     */
    public static function isSessionValid(string $token): bool
    {
        $tokenHash = hash('sha256', $token);

        $session = Database::fetchOne(
            "SELECT id FROM user_sessions WHERE token_hash = ? AND expires_at > NOW()",
            [$tokenHash]
        );

        return $session !== false;
    }

    /**
     * Generate a secure random token
     *
     * @param int $length
     * @return string
     */
    public static function generateSecureToken(int $length = 64): string
    {
        return bin2hex(random_bytes($length / 2));
    }

    /**
     * Hash password using bcrypt
     *
     * @param string $password
     * @return string
     */
    public static function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    /**
     * Verify password against hash
     *
     * @param string $password
     * @param string $hash
     * @return bool
     */
    public static function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }

    /**
     * Sign data using HMAC-SHA256
     *
     * @param string $data
     * @return string
     */
    private static function sign(string $data): string
    {
        return hash_hmac('sha256', $data, self::$config['secret'], true);
    }

    /**
     * Base64 URL encode
     *
     * @param string $data
     * @return string
     */
    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode
     *
     * @param string $data
     * @return string
     */
    private static function base64UrlDecode(string $data): string
    {
        $padding = 4 - (strlen($data) % 4);
        if ($padding !== 4) {
            $data .= str_repeat('=', $padding);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Cleanup expired sessions (call via cron)
     *
     * @return int Number of deleted sessions
     */
    public static function cleanupExpiredSessions(): int
    {
        return Database::execute(
            "DELETE FROM user_sessions WHERE expires_at < NOW()"
        );
    }
}
