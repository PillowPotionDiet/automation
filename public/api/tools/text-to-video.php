<?php
/**
 * Text-to-Video Generation API Endpoint
 *
 * POST /api/tools/text-to-video.php
 *
 * Request:
 * {
 *   "prompt": "A bird flying across a sunset sky",
 *   "model": "kling-standard",
 *   "duration": 5
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "generation_id": 123,
 *     "request_uuid": "uuid-here",
 *     "status": "pending",
 *     "credits_charged": 30
 *   }
 * }
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/utils/Validator.php';
require_once APP_PATH . '/models/User.php';
require_once APP_PATH . '/models/Generation.php';
require_once APP_PATH . '/services/AuthService.php';
require_once APP_PATH . '/services/GeminiGenService.php';
require_once APP_PATH . '/middlewares/AuthMiddleware.php';

// Only allow POST
Response::requireMethod('POST');

// Authenticate user
$user = AuthMiddleware::authenticate();

// Check if email is verified
if (!$user['email_verified']) {
    Response::error('Please verify your email before using tools', 403);
}

// Get input
$input = Response::getJsonInput();

// Validate input
$errors = [];

if (empty($input['prompt'])) {
    $errors['prompt'] = 'Prompt is required';
} elseif (strlen($input['prompt']) > 2000) {
    $errors['prompt'] = 'Prompt must be less than 2000 characters';
}

$model = $input['model'] ?? 'kling-standard';
$validModels = array_keys(GeminiGenService::VIDEO_MODELS);
if (!in_array($model, $validModels)) {
    $errors['model'] = 'Invalid model. Valid options: ' . implode(', ', $validModels);
}

$duration = $input['duration'] ?? 5;
if (!is_numeric($duration) || $duration < 1 || $duration > 10) {
    $errors['duration'] = 'Duration must be between 1 and 10 seconds';
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Calculate credits needed
$creditsNeeded = GeminiGenService::getCreditsForModel($model, 'video');

// Check user has enough credits
if ($user['credits'] < $creditsNeeded) {
    Response::error('Insufficient credits. You have ' . $user['credits'] . ' credits, but need ' . $creditsNeeded, 402);
}

// Check if user has API key (admin-assigned or use system key)
$apiKey = $user['api_key'] ?? ($_ENV['GEMINIGEN_API_KEY'] ?? null);

if (!$apiKey) {
    Response::error('No API key configured. Please contact admin.', 400);
}

try {
    // Generate unique request UUID
    $requestUuid = Generation::generateUuid();

    // Deduct credits first (optimistic - will refund on failure)
    $creditResult = User::updateCredits(
        $user['id'],
        -$creditsNeeded,
        'video_generation',
        $requestUuid,
        $model,
        'Text-to-Video: ' . substr($input['prompt'], 0, 100)
    );

    if (!$creditResult['success']) {
        Response::error($creditResult['error'] ?? 'Failed to process credits', 400);
    }

    // Create generation log entry
    $generationId = Generation::create([
        'user_id' => $user['id'],
        'tool_type' => Generation::TOOL_TEXT_TO_VIDEO,
        'generation_type' => Generation::TYPE_VIDEO,
        'model' => $model,
        'credits_charged' => $creditsNeeded,
        'request_uuid' => $requestUuid,
        'prompt' => $input['prompt'],
        'status' => Generation::STATUS_PENDING
    ]);

    // Initialize GeminiGen service
    $gemini = new GeminiGenService($apiKey);

    // Make API request
    $result = $gemini->generateVideo([
        'prompt' => $input['prompt'],
        'model' => $model,
        'duration' => (int) $duration,
        'webhook_url' => GeminiGenService::getWebhookUrl(),
        'request_uuid' => $requestUuid
    ]);

    if ($result['success']) {
        // Update status to processing
        Generation::updateStatus($requestUuid, Generation::STATUS_PROCESSING);

        Response::success([
            'generation_id' => $generationId,
            'request_uuid' => $requestUuid,
            'status' => 'processing',
            'credits_charged' => $creditsNeeded,
            'new_balance' => $creditResult['new_balance'],
            'job_id' => $result['data']['id'] ?? null
        ], 200, 'Video generation started');
    } else {
        // API call failed - refund credits
        User::updateCredits(
            $user['id'],
            $creditsNeeded,
            'refund',
            $requestUuid,
            $model,
            'Refund: API call failed'
        );

        Generation::updateStatus($requestUuid, Generation::STATUS_FAILED, [
            'error_message' => $result['error']
        ]);

        Response::error('Generation failed: ' . $result['error'], 500);
    }

} catch (Exception $e) {
    error_log('Text-to-Video error: ' . $e->getMessage());

    // Attempt to refund if we have a UUID
    if (isset($requestUuid) && isset($creditsNeeded)) {
        User::updateCredits(
            $user['id'],
            $creditsNeeded,
            'refund',
            $requestUuid,
            $model ?? 'unknown',
            'Refund: System error'
        );
    }

    Response::error('An error occurred during generation. Please try again.', 500);
}
