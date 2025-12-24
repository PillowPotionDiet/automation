<?php
/**
 * Text-to-Image Generation API Endpoint
 *
 * POST /api/tools/text-to-image.php
 *
 * Request:
 * {
 *   "prompt": "A beautiful sunset over mountains",
 *   "model": "flux",
 *   "aspect_ratio": "16:9"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "generation_id": 123,
 *     "request_uuid": "uuid-here",
 *     "status": "pending",
 *     "credits_charged": 1
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

$model = $input['model'] ?? 'flux';
$validModels = array_keys(GeminiGenService::IMAGE_MODELS);
if (!in_array($model, $validModels)) {
    $errors['model'] = 'Invalid model. Valid options: ' . implode(', ', $validModels);
}

$aspectRatio = $input['aspect_ratio'] ?? '1:1';
$validRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
if (!in_array($aspectRatio, $validRatios)) {
    $errors['aspect_ratio'] = 'Invalid aspect ratio. Valid options: ' . implode(', ', $validRatios);
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Calculate credits needed
$creditsNeeded = GeminiGenService::getCreditsForModel($model, 'image');

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
        'image_generation',
        $requestUuid,
        $model,
        'Text-to-Image: ' . substr($input['prompt'], 0, 100)
    );

    if (!$creditResult['success']) {
        Response::error($creditResult['error'] ?? 'Failed to process credits', 400);
    }

    // Create generation log entry
    $generationId = Generation::create([
        'user_id' => $user['id'],
        'tool_type' => Generation::TOOL_TEXT_TO_IMAGE,
        'generation_type' => Generation::TYPE_IMAGE,
        'model' => $model,
        'credits_charged' => $creditsNeeded,
        'request_uuid' => $requestUuid,
        'prompt' => $input['prompt'],
        'status' => Generation::STATUS_PENDING
    ]);

    // Initialize GeminiGen service
    $gemini = new GeminiGenService($apiKey);

    // Make API request
    $result = $gemini->generateImage([
        'prompt' => $input['prompt'],
        'model' => $model,
        'aspect_ratio' => $aspectRatio,
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
        ], 200, 'Image generation started');
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
    error_log('Text-to-Image error: ' . $e->getMessage());

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
