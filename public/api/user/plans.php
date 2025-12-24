<?php
/**
 * Credit Plans API Endpoint
 *
 * GET /api/user/plans.php - Get all available credit plans
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "plans": [
 *       {"id": 1, "name": "Basic", "price": 20, "credits": 1000},
 *       ...
 *     ]
 *   }
 * }
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/utils/Database.php';

// Only allow GET
Response::requireMethod('GET');

try {
    // Get all active plans
    $plans = Database::fetchAll(
        "SELECT id, name, price, credits, description
         FROM plans
         WHERE is_active = TRUE
         ORDER BY price ASC"
    );

    // Calculate value per credit for each plan
    $plans = array_map(function ($plan) {
        $plan['id'] = (int) $plan['id'];
        $plan['price'] = (float) $plan['price'];
        $plan['credits'] = (int) $plan['credits'];
        $plan['value_per_credit'] = $plan['price'] > 0
            ? round($plan['price'] / $plan['credits'], 4)
            : 0;
        return $plan;
    }, $plans);

    Response::success([
        'plans' => $plans,
        'payment_info' => [
            'methods' => ['Bank Transfer', 'JazzCash', 'EasyPaisa'],
            'contact' => 'pillowpotion.com@gmail.com',
            'note' => 'After payment, submit a credit request with your payment proof for approval.'
        ]
    ]);

} catch (Exception $e) {
    error_log('Plans API error: ' . $e->getMessage());
    Response::error('Failed to fetch plans', 500);
}
