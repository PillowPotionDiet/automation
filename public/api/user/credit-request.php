<?php
/**
 * Credit Request API Endpoint
 *
 * POST /api/user/credit-request.php - Submit a credit purchase request
 *
 * Request:
 * {
 *   "plan_id": 2,
 *   "payment_proof": "base64-encoded-image-or-url",
 *   "notes": "Paid via JazzCash"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "request_id": 123,
 *     "status": "pending"
 *   }
 * }
 *
 * GET /api/user/credit-request.php - Get user's credit requests
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/utils/Database.php';
require_once APP_PATH . '/models/User.php';
require_once APP_PATH . '/services/AuthService.php';
require_once APP_PATH . '/middlewares/AuthMiddleware.php';

// Authenticate user
$user = AuthMiddleware::authenticate();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get user's credit requests
    try {
        $requests = Database::fetchAll(
            "SELECT
                cr.id,
                cr.plan_id,
                p.name as plan_name,
                cr.amount,
                cr.credits,
                cr.status,
                cr.user_notes,
                cr.admin_notes,
                cr.created_at,
                cr.processed_at
             FROM credit_requests cr
             JOIN plans p ON cr.plan_id = p.id
             WHERE cr.user_id = ?
             ORDER BY cr.created_at DESC
             LIMIT 20",
            [$user['id']]
        );

        Response::success([
            'requests' => array_map(function ($r) {
                return [
                    'id' => (int) $r['id'],
                    'plan' => $r['plan_name'],
                    'amount' => (float) $r['amount'],
                    'credits' => (int) $r['credits'],
                    'status' => $r['status'],
                    'user_notes' => $r['user_notes'],
                    'admin_notes' => $r['admin_notes'],
                    'created_at' => $r['created_at'],
                    'processed_at' => $r['processed_at']
                ];
            }, $requests)
        ]);

    } catch (Exception $e) {
        error_log('Credit request GET error: ' . $e->getMessage());
        Response::error('Failed to fetch credit requests', 500);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Submit new credit request
    $input = Response::getJsonInput();

    // Validate input
    $errors = [];

    if (empty($input['plan_id'])) {
        $errors['plan_id'] = 'Plan is required';
    }

    if (empty($input['payment_proof'])) {
        $errors['payment_proof'] = 'Payment proof is required';
    }

    if (!empty($errors)) {
        Response::validationError($errors);
    }

    try {
        // Get plan details
        $plan = Database::fetchOne(
            "SELECT * FROM plans WHERE id = ? AND is_active = TRUE",
            [$input['plan_id']]
        );

        if (!$plan) {
            Response::validationError(['plan_id' => 'Invalid or inactive plan']);
        }

        // Check for pending requests (prevent spam)
        $pendingCount = Database::fetchColumn(
            "SELECT COUNT(*) FROM credit_requests WHERE user_id = ? AND status = 'pending'",
            [$user['id']]
        );

        if ($pendingCount >= 3) {
            Response::error('You have too many pending requests. Please wait for approval.', 429);
        }

        // Create credit request
        Database::execute(
            "INSERT INTO credit_requests (user_id, plan_id, amount, credits, payment_proof, user_notes)
             VALUES (?, ?, ?, ?, ?, ?)",
            [
                $user['id'],
                $plan['id'],
                $plan['price'],
                $plan['credits'],
                $input['payment_proof'],
                $input['notes'] ?? null
            ]
        );

        $requestId = Database::lastInsertId();

        Response::success([
            'request_id' => (int) $requestId,
            'plan' => $plan['name'],
            'amount' => (float) $plan['price'],
            'credits' => (int) $plan['credits'],
            'status' => 'pending'
        ], 201, 'Credit request submitted. An admin will review your payment proof.');

    } catch (Exception $e) {
        error_log('Credit request POST error: ' . $e->getMessage());
        Response::error('Failed to submit credit request', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}
