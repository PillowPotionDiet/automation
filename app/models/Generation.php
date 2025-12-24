<?php
/**
 * Generation Model
 *
 * Handles all generation-related database operations.
 * Used for logging image/video generations and webhook processing.
 */

require_once __DIR__ . '/../utils/Database.php';

class Generation
{
    // Tool types
    const TOOL_YOUTUBE_STORY = 'youtube_story';
    const TOOL_SCRIPT_TO_VIDEO = 'script_to_video';
    const TOOL_TEXT_TO_VIDEO = 'text_to_video';
    const TOOL_TEXT_TO_IMAGE = 'text_to_image';

    // Generation types
    const TYPE_IMAGE = 'image';
    const TYPE_VIDEO = 'video';
    const TYPE_TEXT = 'text';

    // Status values
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    // Credit costs per model (image)
    const IMAGE_CREDITS = [
        'flux' => 1,
        'ideogram' => 2,
        'nano_banana_pro' => 1,
        'imagen_4_fast' => 1,
        'imagen_4' => 3,
        'imagen_4_ultra' => 4
    ];

    // Credit costs per model (video)
    const VIDEO_CREDITS = [
        'kling-standard' => 30,
        'kling-pro' => 60,
        'hailuo' => 30,
        'luma' => 30,
        'veo_3_1_fast_hd' => 2,
        'veo_2' => 20,
        'veo_3_1_hd' => 100
    ];

    /**
     * Create a new generation log entry
     *
     * @param array $data
     * @return int Generation ID
     */
    public static function create(array $data): int
    {
        $sql = "INSERT INTO generation_logs
                (user_id, tool_type, generation_type, model, credits_charged, request_uuid, prompt, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        Database::execute($sql, [
            $data['user_id'],
            $data['tool_type'],
            $data['generation_type'],
            $data['model'],
            $data['credits_charged'],
            $data['request_uuid'],
            $data['prompt'] ?? null,
            $data['status'] ?? self::STATUS_PENDING
        ]);

        return (int) Database::lastInsertId();
    }

    /**
     * Find generation by ID
     *
     * @param int $id
     * @return array|null
     */
    public static function findById(int $id): ?array
    {
        $generation = Database::fetchOne(
            "SELECT * FROM generation_logs WHERE id = ?",
            [$id]
        );

        return $generation ?: null;
    }

    /**
     * Find generation by request UUID
     *
     * @param string $uuid
     * @return array|null
     */
    public static function findByUuid(string $uuid): ?array
    {
        $generation = Database::fetchOne(
            "SELECT * FROM generation_logs WHERE request_uuid = ?",
            [$uuid]
        );

        return $generation ?: null;
    }

    /**
     * Update generation status
     *
     * @param string $uuid
     * @param string $status
     * @param array $additionalData
     * @return bool
     */
    public static function updateStatus(string $uuid, string $status, array $additionalData = []): bool
    {
        $updates = ['status = ?'];
        $params = [$status];

        if (isset($additionalData['result_url'])) {
            $updates[] = 'result_url = ?';
            $params[] = $additionalData['result_url'];
        }

        if (isset($additionalData['error_message'])) {
            $updates[] = 'error_message = ?';
            $params[] = $additionalData['error_message'];
        }

        if (isset($additionalData['actual_credits_used'])) {
            $updates[] = 'actual_credits_used = ?';
            $params[] = $additionalData['actual_credits_used'];
        }

        if ($status === self::STATUS_COMPLETED || $status === self::STATUS_FAILED) {
            $updates[] = 'completed_at = NOW()';
            $updates[] = 'webhook_received = TRUE';
        }

        $params[] = $uuid;

        return Database::execute(
            "UPDATE generation_logs SET " . implode(', ', $updates) . " WHERE request_uuid = ?",
            $params
        ) > 0;
    }

    /**
     * Get user's generations
     *
     * @param int $userId
     * @param string|null $toolType
     * @param int $limit
     * @param int $offset
     * @return array
     */
    public static function getUserGenerations(
        int $userId,
        ?string $toolType = null,
        int $limit = 50,
        int $offset = 0
    ): array {
        $where = ['user_id = ?'];
        $params = [$userId];

        if ($toolType) {
            $where[] = 'tool_type = ?';
            $params[] = $toolType;
        }

        $params[] = $limit;
        $params[] = $offset;

        return Database::fetchAll(
            "SELECT * FROM generation_logs
             WHERE " . implode(' AND ', $where) . "
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?",
            $params
        );
    }

    /**
     * Get pending generations (for polling)
     *
     * @param int $userId
     * @return array
     */
    public static function getPendingGenerations(int $userId): array
    {
        return Database::fetchAll(
            "SELECT * FROM generation_logs
             WHERE user_id = ? AND status IN ('pending', 'processing')
             ORDER BY created_at ASC",
            [$userId]
        );
    }

    /**
     * Get credit cost for a model
     *
     * @param string $model
     * @param string $generationType 'image' or 'video'
     * @return int
     */
    public static function getCreditsForModel(string $model, string $generationType): int
    {
        if ($generationType === self::TYPE_IMAGE) {
            return self::IMAGE_CREDITS[$model] ?? 1;
        }

        if ($generationType === self::TYPE_VIDEO) {
            return self::VIDEO_CREDITS[$model] ?? 30;
        }

        return 1;
    }

    /**
     * Count user's generations
     *
     * @param int $userId
     * @param string|null $toolType
     * @return int
     */
    public static function countUserGenerations(int $userId, ?string $toolType = null): int
    {
        $where = ['user_id = ?'];
        $params = [$userId];

        if ($toolType) {
            $where[] = 'tool_type = ?';
            $params[] = $toolType;
        }

        return (int) Database::fetchColumn(
            "SELECT COUNT(*) FROM generation_logs WHERE " . implode(' AND ', $where),
            $params
        );
    }

    /**
     * Get user's generation statistics
     *
     * @param int $userId
     * @return array
     */
    public static function getUserStats(int $userId): array
    {
        $stats = Database::fetchOne(
            "SELECT
                COUNT(*) as total_generations,
                SUM(CASE WHEN generation_type = 'image' THEN 1 ELSE 0 END) as image_count,
                SUM(CASE WHEN generation_type = 'video' THEN 1 ELSE 0 END) as video_count,
                SUM(credits_charged) as total_credits_used,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count
             FROM generation_logs
             WHERE user_id = ?",
            [$userId]
        );

        return $stats ?: [
            'total_generations' => 0,
            'image_count' => 0,
            'video_count' => 0,
            'total_credits_used' => 0,
            'completed_count' => 0,
            'failed_count' => 0
        ];
    }

    /**
     * Log webhook event
     *
     * @param string|null $uuid
     * @param string|null $eventName
     * @param array $payload
     * @return int
     */
    public static function logWebhook(?string $uuid, ?string $eventName, array $payload): int
    {
        Database::execute(
            "INSERT INTO webhook_logs (request_uuid, event_name, payload) VALUES (?, ?, ?)",
            [$uuid, $eventName, json_encode($payload)]
        );

        return (int) Database::lastInsertId();
    }

    /**
     * Mark webhook as processed
     *
     * @param int $webhookLogId
     * @param string|null $errorMessage
     * @return bool
     */
    public static function markWebhookProcessed(int $webhookLogId, ?string $errorMessage = null): bool
    {
        return Database::execute(
            "UPDATE webhook_logs SET processed = TRUE, error_message = ? WHERE id = ?",
            [$errorMessage, $webhookLogId]
        ) > 0;
    }

    /**
     * Generate a unique request UUID
     *
     * @return string
     */
    public static function generateUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}
