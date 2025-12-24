<?php
/**
 * Script-to-Video Generation API Endpoint
 *
 * POST /api/tools/script-to-video.php
 *
 * This endpoint handles multi-scene video generation from scripts.
 * It processes scenes sequentially and tracks overall progress.
 *
 * Request:
 * {
 *   "title": "My Video Story",
 *   "scenes": [
 *     {"id": 1, "text": "Scene text", "prompt": "Visual prompt for scene 1"},
 *     {"id": 2, "text": "Scene text", "prompt": "Visual prompt for scene 2"}
 *   ],
 *   "model": "kling-pro"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "project_id": "proj-uuid",
 *     "total_scenes": 3,
 *     "total_credits": 180,
 *     "status": "processing",
 *     "scenes": [
 *       {"id": 1, "request_uuid": "...", "status": "pending"},
 *       {"id": 2, "request_uuid": "...", "status": "pending"}
 *     ]
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

if (empty($input['title'])) {
    $errors['title'] = 'Project title is required';
}

if (empty($input['scenes']) || !is_array($input['scenes'])) {
    $errors['scenes'] = 'At least one scene is required';
} elseif (count($input['scenes']) > 20) {
    $errors['scenes'] = 'Maximum 20 scenes allowed per project';
} else {
    foreach ($input['scenes'] as $index => $scene) {
        if (empty($scene['prompt'])) {
            $errors["scenes[$index].prompt"] = 'Each scene must have a prompt';
        }
    }
}

$model = $input['model'] ?? 'kling-pro';
$validModels = array_keys(GeminiGenService::VIDEO_MODELS);
if (!in_array($model, $validModels)) {
    $errors['model'] = 'Invalid model. Valid options: ' . implode(', ', $validModels);
}

if (!empty($errors)) {
    Response::validationError($errors);
}

// Calculate total credits needed
$creditsPerScene = GeminiGenService::getCreditsForModel($model, 'video');
$totalScenes = count($input['scenes']);
$totalCreditsNeeded = $creditsPerScene * $totalScenes;

// Check user has enough credits
if ($user['credits'] < $totalCreditsNeeded) {
    Response::error(
        'Insufficient credits. You have ' . $user['credits'] . ' credits, but need ' . $totalCreditsNeeded .
        ' (' . $creditsPerScene . ' per scene × ' . $totalScenes . ' scenes)',
        402
    );
}

// Check if user has API key
$apiKey = $user['api_key'] ?? ($_ENV['GEMINIGEN_API_KEY'] ?? null);

if (!$apiKey) {
    Response::error('No API key configured. Please contact admin.', 400);
}

try {
    // Generate project UUID
    $projectUuid = 'proj-' . Generation::generateUuid();

    // Deduct all credits upfront
    $creditResult = User::updateCredits(
        $user['id'],
        -$totalCreditsNeeded,
        'video_generation',
        $projectUuid,
        $model,
        'Script-to-Video: ' . $input['title'] . ' (' . $totalScenes . ' scenes)'
    );

    if (!$creditResult['success']) {
        Response::error($creditResult['error'] ?? 'Failed to process credits', 400);
    }

    // Initialize GeminiGen service
    $gemini = new GeminiGenService($apiKey);

    // Process each scene
    $sceneResults = [];
    $failedScenes = [];

    foreach ($input['scenes'] as $scene) {
        $sceneUuid = Generation::generateUuid();

        // Create generation log entry
        $generationId = Generation::create([
            'user_id' => $user['id'],
            'tool_type' => Generation::TOOL_SCRIPT_TO_VIDEO,
            'generation_type' => Generation::TYPE_VIDEO,
            'model' => $model,
            'credits_charged' => $creditsPerScene,
            'request_uuid' => $sceneUuid,
            'prompt' => $scene['prompt'],
            'status' => Generation::STATUS_PENDING
        ]);

        // Make API request for this scene
        $result = $gemini->generateVideo([
            'prompt' => $scene['prompt'],
            'model' => $model,
            'duration' => 5, // Default 5 seconds per scene
            'webhook_url' => GeminiGenService::getWebhookUrl(),
            'request_uuid' => $sceneUuid
        ]);

        if ($result['success']) {
            Generation::updateStatus($sceneUuid, Generation::STATUS_PROCESSING);

            $sceneResults[] = [
                'id' => $scene['id'] ?? count($sceneResults) + 1,
                'generation_id' => $generationId,
                'request_uuid' => $sceneUuid,
                'status' => 'processing',
                'job_id' => $result['data']['id'] ?? null
            ];
        } else {
            Generation::updateStatus($sceneUuid, Generation::STATUS_FAILED, [
                'error_message' => $result['error']
            ]);

            $failedScenes[] = [
                'id' => $scene['id'] ?? count($sceneResults) + 1,
                'error' => $result['error']
            ];
        }
    }

    // Calculate refund for failed scenes
    if (!empty($failedScenes)) {
        $refundAmount = count($failedScenes) * $creditsPerScene;
        User::updateCredits(
            $user['id'],
            $refundAmount,
            'refund',
            $projectUuid,
            $model,
            'Partial refund: ' . count($failedScenes) . ' scenes failed'
        );
    }

    // Get updated balance
    $newBalance = User::getCredits($user['id']);

    Response::success([
        'project_id' => $projectUuid,
        'title' => $input['title'],
        'total_scenes' => $totalScenes,
        'successful_scenes' => count($sceneResults),
        'failed_scenes' => count($failedScenes),
        'credits_charged' => $totalCreditsNeeded - (count($failedScenes) * $creditsPerScene),
        'new_balance' => $newBalance,
        'status' => empty($failedScenes) ? 'processing' : 'partial',
        'scenes' => $sceneResults,
        'errors' => $failedScenes
    ], 200, 'Script-to-Video generation started');

} catch (Exception $e) {
    error_log('Script-to-Video error: ' . $e->getMessage());

    // Attempt to refund all credits if we haven't started processing
    if (isset($projectUuid) && empty($sceneResults)) {
        User::updateCredits(
            $user['id'],
            $totalCreditsNeeded,
            'refund',
            $projectUuid,
            $model,
            'Refund: System error before processing'
        );
    }

    Response::error('An error occurred during generation. Please try again.', 500);
}
