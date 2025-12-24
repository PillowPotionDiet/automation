<?php
/**
 * Admin Credit Requests API
 *
 * GET /api/admin/credit-requests.php - List credit requests
 * POST /api/admin/credit-requests.php - Approve/reject requests
 */

// Load config (handles path detection for different environments)
require_once __DIR__ . '/../config.php';

// Load dependencies
require_once APP_PATH . '/utils/Database.php';
require_once APP_PATH . '/models/User.php';
require_once APP_PATH . '/middlewares/AdminMiddleware.php';

// Check admin access
$admin = AdminMiddleware::check();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // List credit requests
    $limit = min(100, max(1, (int) ($_GET['limit'] ?? 20)));
    $offset = max(0, (int) ($_GET['offset'] ?? 0));
    $status = $_GET['status'] ?? null;

    try {
        $where = ['1=1'];
        $params = [];

        if ($status && $status !== 'all') {
            $where[] = "cr.status = ?";
            $params[] = $status;
        }

        $whereClause = implode(' AND ', $where);

        // Get total count
        $total = Database::fetchColumn(
            "SELECT COUNT(*) FROM credit_requests cr WHERE {$whereClause}",
            $params
        );

        // Get requests
        $params[] = $limit;
        $params[] = $offset;

        $requests = Database::fetchAll(
            "SELECT
                cr.id,
                cr.user_id,
                u.email,
                cr.plan_id,
                p.name as plan_name,
                cr.amount,
                cr.credits,
                cr.status,
                cr.payment_proof,
                cr.user_notes,
                cr.admin_notes,
                cr.approved_by,
                cr.processed_at,
                cr.created_at
             FROM credit_requests cr
             JOIN users u ON cr.user_id = u.id
             JOIN plans p ON cr.plan_id = p.id
             WHERE {$whereClause}
             ORDER BY cr.created_at DESC
             LIMIT ? OFFSET ?",
            $params
        );

        Response::success([
            'total' => (int) $total,
            'limit' => $limit,
            'offset' => $offset,
            'items' => array_map(function ($r) {
                return [
                    'id' => (int) $r['id'],
                    'user_id' => (int) $r['user_id'],
                    'email' => $r['email'],
                    'plan_id' => (int) $r['plan_id'],
                    'plan_name' => $r['plan_name'],
                    'amount' => (float) $r['amount'],
                    'credits' => (int) $r['credits'],
                    'status' => $r['status'],
                    'payment_proof' => $r['payment_proof'],
                    'user_notes' => $r['user_notes'],
                    'admin_notes' => $r['admin_notes'],
                    'processed_at' => $r['processed_at'],
                    'created_at' => $r['created_at']
                ];
            }, $requests)
        ]);

    } catch (Exception $e) {
        error_log('Admin credit-requests GET error: ' . $e->getMessage());
        Response::error('Failed to fetch requests', 500);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Approve/reject request
    $input = Response::getJsonInput();

    $action = $input['action'] ?? null;
    $requestId = $input['request_id'] ?? null;

    if (!$requestId) {
        Response::validationError(['request_id' => 'Request ID is required']);
    }

    if (!in_array($action, ['approve', 'reject'])) {
        Response::validationError(['action' => 'Invalid action. Use "approve" or "reject"']);
    }

    try {
        // Get request details
        $request = Database::fetchOne(
            "SELECT cr.*, u.email, u.credits as user_credits
             FROM credit_requests cr
             JOIN users u ON cr.user_id = u.id
             WHERE cr.id = ?",
            [$requestId]
        );

        if (!$request) {
            Response::notFound('Request not found');
        }

        if ($request['status'] !== 'pending') {
            Response::error('This request has already been processed', 400);
        }

        Database::beginTransaction();

        if ($action === 'approve') {
            // Add credits to user
            $result = User::updateCredits(
                $request['user_id'],
                $request['credits'],
                'purchase',
                'request_' . $requestId,
                null,
                "Credit purchase: {$request['credits']} credits"
            );

            if (!$result['success']) {
                Database::rollback();
                Response::error('Failed to add credits: ' . ($result['error'] ?? 'Unknown error'), 500);
            }

            // Update request status
            Database::execute(
                "UPDATE credit_requests
                 SET status = 'approved',
                     approved_by = ?,
                     admin_notes = ?,
                     processed_at = NOW()
                 WHERE id = ?",
                [$admin['user_id'], $input['notes'] ?? null, $requestId]
            );

            AdminMiddleware::logAction(
                $admin['user_id'],
                'approve_request',
                $request['user_id'],
                [
                    'request_id' => $requestId,
                    'credits' => $request['credits'],
                    'amount' => $request['amount']
                ]
            );

            Database::commit();

            Response::success([
                'new_balance' => $result['new_balance']
            ], 200, "Approved! {$request['credits']} credits added to {$request['email']}");

        } else {
            // Reject request
            Database::execute(
                "UPDATE credit_requests
                 SET status = 'rejected',
                     approved_by = ?,
                     admin_notes = ?,
                     processed_at = NOW()
                 WHERE id = ?",
                [$admin['user_id'], $input['reason'] ?? $input['notes'] ?? null, $requestId]
            );

            AdminMiddleware::logAction(
                $admin['user_id'],
                'reject_request',
                $request['user_id'],
                [
                    'request_id' => $requestId,
                    'reason' => $input['reason'] ?? null
                ]
            );

            Database::commit();

            Response::success(null, 200, 'Request rejected');
        }

    } catch (Exception $e) {
        Database::rollback();
        error_log('Admin credit-requests POST error: ' . $e->getMessage());
        Response::error('Operation failed', 500);
    }

} else {
    Response::error('Method not allowed', 405);
}
