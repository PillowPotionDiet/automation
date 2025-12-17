<?php
/**
 * Response Utility Class
 *
 * JSON response helper for API endpoints.
 * Provides consistent response format across all API calls.
 */

class Response
{
    /**
     * Send a success response
     *
     * @param mixed $data Response data
     * @param int $statusCode HTTP status code (default: 200)
     * @param string|null $message Optional success message
     */
    public static function success(mixed $data = null, int $statusCode = 200, ?string $message = null): void
    {
        self::send([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], $statusCode);
    }

    /**
     * Send an error response
     *
     * @param string $message Error message
     * @param int $statusCode HTTP status code (default: 400)
     * @param mixed $errors Additional error details
     */
    public static function error(string $message, int $statusCode = 400, mixed $errors = null): void
    {
        self::send([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ], $statusCode);
    }

    /**
     * Send a validation error response
     *
     * @param array $errors Validation errors array
     */
    public static function validationError(array $errors): void
    {
        self::send([
            'success' => false,
            'message' => 'Validation failed',
            'errors' => $errors
        ], 422);
    }

    /**
     * Send an unauthorized response
     *
     * @param string $message Error message
     */
    public static function unauthorized(string $message = 'Unauthorized access'): void
    {
        self::send([
            'success' => false,
            'message' => $message
        ], 401);
    }

    /**
     * Send a forbidden response
     *
     * @param string $message Error message
     */
    public static function forbidden(string $message = 'Access forbidden'): void
    {
        self::send([
            'success' => false,
            'message' => $message
        ], 403);
    }

    /**
     * Send a not found response
     *
     * @param string $message Error message
     */
    public static function notFound(string $message = 'Resource not found'): void
    {
        self::send([
            'success' => false,
            'message' => $message
        ], 404);
    }

    /**
     * Send a server error response
     *
     * @param string $message Error message
     */
    public static function serverError(string $message = 'Internal server error'): void
    {
        self::send([
            'success' => false,
            'message' => $message
        ], 500);
    }

    /**
     * Send insufficient credits response
     *
     * @param int $required Credits required
     * @param int $available Credits available
     */
    public static function insufficientCredits(int $required, int $available): void
    {
        self::send([
            'success' => false,
            'message' => 'Insufficient credits',
            'data' => [
                'required' => $required,
                'available' => $available,
                'shortfall' => $required - $available
            ]
        ], 402); // 402 Payment Required
    }

    /**
     * Send paginated response
     *
     * @param array $items Items array
     * @param int $total Total count
     * @param int $page Current page
     * @param int $perPage Items per page
     */
    public static function paginated(array $items, int $total, int $page, int $perPage): void
    {
        self::send([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage),
                'has_more' => ($page * $perPage) < $total
            ]
        ], 200);
    }

    /**
     * Send the JSON response
     *
     * @param array $data Response data
     * @param int $statusCode HTTP status code
     */
    private static function send(array $data, int $statusCode): void
    {
        // Set headers
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');

        // Remove null values from response
        $data = array_filter($data, fn($value) => $value !== null);

        // Output JSON
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Get JSON input from request body
     *
     * @return array
     */
    public static function getJsonInput(): array
    {
        $input = file_get_contents('php://input');

        if (empty($input)) {
            return [];
        }

        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            self::error('Invalid JSON input', 400);
        }

        return $data ?? [];
    }

    /**
     * Ensure request method matches expected
     *
     * @param string|array $methods Allowed methods
     */
    public static function requireMethod(string|array $methods): void
    {
        $methods = is_array($methods) ? $methods : [$methods];
        $requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if (!in_array($requestMethod, $methods)) {
            self::error('Method not allowed', 405);
        }
    }
}
