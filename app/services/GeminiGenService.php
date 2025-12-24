<?php
/**
 * GeminiGen API Service
 *
 * Handles all communication with the GeminiGen.ai API.
 * Supports image and video generation via the proxy.
 */

class GeminiGenService
{
    // API Configuration
    private const PROXY_URL = '/v2/proxy';  // Internal proxy endpoint
    private const API_BASE = 'https://api.geminigen.ai';

    // Available models
    const IMAGE_MODELS = [
        'flux' => ['name' => 'Flux', 'credits' => 1],
        'ideogram' => ['name' => 'Ideogram', 'credits' => 2],
        'nano_banana_pro' => ['name' => 'Nano Banana Pro', 'credits' => 1],
        'imagen_4_fast' => ['name' => 'Imagen 4 Fast', 'credits' => 1],
        'imagen_4' => ['name' => 'Imagen 4', 'credits' => 3],
        'imagen_4_ultra' => ['name' => 'Imagen 4 Ultra', 'credits' => 4]
    ];

    const VIDEO_MODELS = [
        'kling-standard' => ['name' => 'Kling 1.6 Standard', 'credits' => 30],
        'kling-pro' => ['name' => 'Kling 1.6 Pro', 'credits' => 60],
        'hailuo' => ['name' => 'Hailuo', 'credits' => 30],
        'luma' => ['name' => 'Luma Dream Machine', 'credits' => 30],
        'veo_3_1_fast_hd' => ['name' => 'Veo 3.1 Fast HD', 'credits' => 2],
        'veo_2' => ['name' => 'Veo 2', 'credits' => 20],
        'veo_3_1_hd' => ['name' => 'Veo 3.1 HD', 'credits' => 100]
    ];

    private string $apiKey;

    /**
     * Create a new GeminiGen service instance
     *
     * @param string $apiKey
     */
    public function __construct(string $apiKey)
    {
        $this->apiKey = $apiKey;
    }

    /**
     * Generate an image
     *
     * @param array $params
     * @return array ['success' => bool, 'data' => array, 'error' => string|null]
     */
    public function generateImage(array $params): array
    {
        $model = $params['model'] ?? 'flux';
        $prompt = $params['prompt'] ?? '';
        $aspectRatio = $params['aspect_ratio'] ?? '1:1';
        $webhookUrl = $params['webhook_url'] ?? null;
        $requestUuid = $params['request_uuid'] ?? null;

        if (empty($prompt)) {
            return ['success' => false, 'error' => 'Prompt is required'];
        }

        $payload = [
            'model' => $model,
            'prompt' => $prompt,
            'aspect_ratio' => $aspectRatio
        ];

        // Add webhook if provided
        if ($webhookUrl) {
            $payload['webhook'] = $webhookUrl;
        }

        // Add UUID for tracking
        if ($requestUuid) {
            $payload['request_uuid'] = $requestUuid;
        }

        // Add reference images if provided
        if (!empty($params['ref_images'])) {
            $payload['ref_images'] = $params['ref_images'];
        }

        return $this->makeRequest('/v1/generate/image', $payload);
    }

    /**
     * Generate a video
     *
     * @param array $params
     * @return array ['success' => bool, 'data' => array, 'error' => string|null]
     */
    public function generateVideo(array $params): array
    {
        $model = $params['model'] ?? 'kling-standard';
        $prompt = $params['prompt'] ?? '';
        $duration = $params['duration'] ?? 5;
        $webhookUrl = $params['webhook_url'] ?? null;
        $requestUuid = $params['request_uuid'] ?? null;

        $payload = [
            'model' => $model,
            'prompt' => $prompt,
            'duration' => $duration
        ];

        // Add start/end images if provided
        if (!empty($params['start_image'])) {
            $payload['start_image'] = $params['start_image'];
        }

        if (!empty($params['end_image'])) {
            $payload['end_image'] = $params['end_image'];
        }

        // Add reference images
        if (!empty($params['ref_images'])) {
            $payload['ref_images'] = $params['ref_images'];
        }

        // Add webhook if provided
        if ($webhookUrl) {
            $payload['webhook'] = $webhookUrl;
        }

        // Add UUID for tracking
        if ($requestUuid) {
            $payload['request_uuid'] = $requestUuid;
        }

        return $this->makeRequest('/v1/generate/video', $payload);
    }

    /**
     * Check generation status
     *
     * @param string $jobId
     * @return array
     */
    public function checkStatus(string $jobId): array
    {
        return $this->makeRequest('/v1/status/' . $jobId, [], 'GET');
    }

    /**
     * Validate API key
     *
     * @return array
     */
    public function validateApiKey(): array
    {
        return $this->makeRequest('/v1/user/credits', [], 'GET');
    }

    /**
     * Get available credits
     *
     * @return array
     */
    public function getCredits(): array
    {
        return $this->makeRequest('/v1/user/credits', [], 'GET');
    }

    /**
     * Make API request
     *
     * @param string $endpoint
     * @param array $payload
     * @param string $method
     * @return array
     */
    private function makeRequest(string $endpoint, array $payload = [], string $method = 'POST'): array
    {
        $url = self::API_BASE . $endpoint;

        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->apiKey,
            'Accept: application/json'
        ];

        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("GeminiGen API Error: " . $error);
            return [
                'success' => false,
                'error' => 'Connection failed: ' . $error,
                'http_code' => 0
            ];
        }

        $data = json_decode($response, true);

        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'success' => true,
                'data' => $data,
                'http_code' => $httpCode
            ];
        }

        // Handle errors
        $errorMessage = $data['detail']['error_message'] ?? $data['message'] ?? 'Unknown error';

        error_log("GeminiGen API Error ($httpCode): " . $errorMessage);

        return [
            'success' => false,
            'error' => $errorMessage,
            'http_code' => $httpCode,
            'data' => $data
        ];
    }

    /**
     * Get credit cost for a model
     *
     * @param string $model
     * @param string $type 'image' or 'video'
     * @return int
     */
    public static function getCreditsForModel(string $model, string $type = 'image'): int
    {
        if ($type === 'image') {
            return self::IMAGE_MODELS[$model]['credits'] ?? 1;
        }

        return self::VIDEO_MODELS[$model]['credits'] ?? 30;
    }

    /**
     * Get webhook URL for the application
     *
     * @return string
     */
    public static function getWebhookUrl(): string
    {
        // Get base URL from environment or default
        $baseUrl = $_ENV['APP_URL'] ?? 'https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost');

        // Check if we need to include /public in the path (GitHub deployment to Hostinger)
        // If APP_URL already includes the full path, use it directly
        // Otherwise, check if we're in a /public deployment structure
        $webhookPath = '/api/webhook/receiver.php';

        // If APP_URL is not set and we're detecting from HTTP_HOST,
        // check if we need to add /public based on the request URI
        if (!isset($_ENV['APP_URL']) && isset($_SERVER['REQUEST_URI'])) {
            // If the current request is coming from /public, include it in webhook URL
            if (strpos($_SERVER['REQUEST_URI'], '/public/') === 0) {
                $webhookPath = '/public' . $webhookPath;
            }
        }

        return $baseUrl . $webhookPath;
    }
}
