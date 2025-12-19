<?php
/**
 * User Model
 *
 * Handles all user-related database operations.
 * Used for authentication, profile management, and credit tracking.
 */

require_once __DIR__ . '/../utils/Database.php';

class User
{
    /**
     * Find user by ID
     *
     * @param int $id
     * @return array|null
     */
    public static function findById(int $id): ?array
    {
        $user = Database::fetchOne(
            "SELECT * FROM users WHERE id = ?",
            [$id]
        );

        return $user ?: null;
    }

    /**
     * Find user by email
     *
     * @param string $email
     * @return array|null
     */
    public static function findByEmail(string $email): ?array
    {
        $user = Database::fetchOne(
            "SELECT * FROM users WHERE email = ?",
            [$email]
        );

        return $user ?: null;
    }

    /**
     * Find user by verification token
     *
     * @param string $token
     * @return array|null
     */
    public static function findByVerificationToken(string $token): ?array
    {
        $user = Database::fetchOne(
            "SELECT * FROM users WHERE verification_token = ?",
            [$token]
        );

        return $user ?: null;
    }

    /**
     * Find user by reset token (check expiry)
     *
     * @param string $token
     * @return array|null
     */
    public static function findByResetToken(string $token): ?array
    {
        $user = Database::fetchOne(
            "SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()",
            [$token]
        );

        return $user ?: null;
    }

    /**
     * Find user by API key
     *
     * @param string $apiKey
     * @return array|null
     */
    public static function findByApiKey(string $apiKey): ?array
    {
        $user = Database::fetchOne(
            "SELECT * FROM users WHERE api_key = ?",
            [$apiKey]
        );

        return $user ?: null;
    }

    /**
     * Create a new user
     *
     * @param array $data
     * @return int User ID
     */
    public static function create(array $data): int
    {
        $sql = "INSERT INTO users (email, password_hash, verification_token, created_at)
                VALUES (?, ?, ?, NOW())";

        Database::execute($sql, [
            $data['email'],
            $data['password_hash'],
            $data['verification_token']
        ]);

        return (int) Database::lastInsertId();
    }

    /**
     * Verify user email
     *
     * @param int $userId
     * @param int $signupBonus Credits to add on verification
     * @return bool
     */
    public static function verifyEmail(int $userId, int $signupBonus = 20): bool
    {
        Database::beginTransaction();

        try {
            // Update user as verified and add signup bonus
            Database::execute(
                "UPDATE users SET
                    email_verified = TRUE,
                    verification_token = NULL,
                    credits = credits + ?
                 WHERE id = ?",
                [$signupBonus, $userId]
            );

            // Get new balance
            $user = self::findById($userId);

            // Log credit transaction
            Database::execute(
                "INSERT INTO credits_ledger (user_id, amount, balance_after, transaction_type, description)
                 VALUES (?, ?, ?, 'signup_bonus', 'Welcome bonus credits')",
                [$userId, $signupBonus, $user['credits']]
            );

            Database::commit();
            return true;

        } catch (Exception $e) {
            Database::rollback();
            error_log('Email verification failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Set password reset token
     *
     * @param int $userId
     * @param string $token
     * @param int $expiryHours Token validity in hours
     * @return bool
     */
    public static function setResetToken(int $userId, string $token, int $expiryHours = 1): bool
    {
        $expiry = date('Y-m-d H:i:s', strtotime("+{$expiryHours} hours"));

        return Database::execute(
            "UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?",
            [$token, $expiry, $userId]
        ) > 0;
    }

    /**
     * Reset user password
     *
     * @param int $userId
     * @param string $newPasswordHash
     * @return bool
     */
    public static function resetPassword(int $userId, string $newPasswordHash): bool
    {
        return Database::execute(
            "UPDATE users SET
                password_hash = ?,
                reset_token = NULL,
                reset_token_expiry = NULL
             WHERE id = ?",
            [$newPasswordHash, $userId]
        ) > 0;
    }

    /**
     * Update user password
     *
     * @param int $userId
     * @param string $newPasswordHash
     * @return bool
     */
    public static function updatePassword(int $userId, string $newPasswordHash): bool
    {
        return Database::execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [$newPasswordHash, $userId]
        ) > 0;
    }

    /**
     * Update user credits
     *
     * @param int $userId
     * @param int $amount Positive to add, negative to deduct
     * @param string $transactionType
     * @param string|null $referenceId
     * @param string|null $model
     * @param string|null $description
     * @return array ['success' => bool, 'new_balance' => int]
     */
    public static function updateCredits(
        int $userId,
        int $amount,
        string $transactionType,
        ?string $referenceId = null,
        ?string $model = null,
        ?string $description = null
    ): array {
        Database::beginTransaction();

        try {
            // Lock user row for update
            $user = Database::fetchOne(
                "SELECT id, credits FROM users WHERE id = ? FOR UPDATE",
                [$userId]
            );

            if (!$user) {
                throw new Exception('User not found');
            }

            $newBalance = $user['credits'] + $amount;

            // Check for negative balance on deduction
            if ($newBalance < 0) {
                Database::rollback();
                return ['success' => false, 'error' => 'Insufficient credits', 'balance' => $user['credits']];
            }

            // Update credits
            Database::execute(
                "UPDATE users SET credits = ? WHERE id = ?",
                [$newBalance, $userId]
            );

            // Log transaction
            Database::execute(
                "INSERT INTO credits_ledger
                    (user_id, amount, balance_after, transaction_type, reference_id, model_used, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?)",
                [$userId, $amount, $newBalance, $transactionType, $referenceId, $model, $description]
            );

            Database::commit();
            return ['success' => true, 'new_balance' => $newBalance];

        } catch (Exception $e) {
            Database::rollback();
            error_log('Credit update failed: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Get user credits balance
     *
     * @param int $userId
     * @return int
     */
    public static function getCredits(int $userId): int
    {
        $credits = Database::fetchColumn(
            "SELECT credits FROM users WHERE id = ?",
            [$userId]
        );

        return (int) ($credits ?? 0);
    }

    /**
     * Set user API key
     *
     * @param int $userId
     * @param string $apiKey
     * @return bool
     */
    public static function setApiKey(int $userId, string $apiKey): bool
    {
        return Database::execute(
            "UPDATE users SET api_key = ? WHERE id = ?",
            [$apiKey, $userId]
        ) > 0;
    }

    /**
     * Update user profile
     *
     * @param int $userId
     * @param array $data Fields to update
     * @return bool
     */
    public static function update(int $userId, array $data): bool
    {
        $allowedFields = ['email', 'role', 'email_verified', 'api_key'];
        $updates = [];
        $params = [];

        foreach ($data as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $updates[] = "{$field} = ?";
                $params[] = $value;
            }
        }

        if (empty($updates)) {
            return false;
        }

        $params[] = $userId;
        $sql = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";

        return Database::execute($sql, $params) > 0;
    }

    /**
     * Get all users (for admin)
     *
     * @param int $limit
     * @param int $offset
     * @param array $filters Optional filters
     * @return array
     */
    public static function getAll(int $limit = 50, int $offset = 0, array $filters = []): array
    {
        $where = [];
        $params = [];

        if (isset($filters['role'])) {
            $where[] = "role = ?";
            $params[] = $filters['role'];
        }

        if (isset($filters['email_verified'])) {
            $where[] = "email_verified = ?";
            $params[] = $filters['email_verified'] ? 1 : 0;
        }

        if (isset($filters['search'])) {
            $where[] = "email LIKE ?";
            $params[] = '%' . $filters['search'] . '%';
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT id, email, role, credits, email_verified, api_key, created_at, updated_at
                FROM users
                {$whereClause}
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?";

        $params[] = $limit;
        $params[] = $offset;

        return Database::fetchAll($sql, $params);
    }

    /**
     * Count users
     *
     * @param array $filters Optional filters
     * @return int
     */
    public static function count(array $filters = []): int
    {
        $where = [];
        $params = [];

        if (isset($filters['role'])) {
            $where[] = "role = ?";
            $params[] = $filters['role'];
        }

        if (isset($filters['email_verified'])) {
            $where[] = "email_verified = ?";
            $params[] = $filters['email_verified'] ? 1 : 0;
        }

        $whereClause = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

        return (int) Database::fetchColumn(
            "SELECT COUNT(*) FROM users {$whereClause}",
            $params
        );
    }

    /**
     * Delete user (soft delete not implemented - use with caution)
     *
     * @param int $userId
     * @return bool
     */
    public static function delete(int $userId): bool
    {
        return Database::execute(
            "DELETE FROM users WHERE id = ? AND role != 'admin'",
            [$userId]
        ) > 0;
    }

    /**
     * Check if email exists
     *
     * @param string $email
     * @return bool
     */
    public static function emailExists(string $email): bool
    {
        return Database::fetchColumn(
            "SELECT COUNT(*) FROM users WHERE email = ?",
            [$email]
        ) > 0;
    }

    /**
     * Get user public data (safe to expose)
     *
     * @param array $user Full user record
     * @return array Filtered user data
     */
    public static function getPublicData(array $user): array
    {
        return [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'credits' => $user['credits'],
            'email_verified' => (bool) $user['email_verified'],
            'has_api_key' => !empty($user['api_key']),
            'created_at' => $user['created_at']
        ];
    }
}
