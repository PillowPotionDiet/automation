<?php
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed. Use POST."
    ]);
    exit;
}

// Read JSON input
$input = json_decode(file_get_contents("php://input"), true);
$apiKey = isset($input["apiKey"]) ? trim($input["apiKey"]) : "";
$prompt = isset($input["prompt"]) ? trim($input["prompt"]) : "";
$model = isset($input["model"]) ? trim($input["model"]) : "nanobanana-pro";
$aspectRatio = isset($input["aspectRatio"]) ? trim($input["aspectRatio"]) : "16:9";
$style = isset($input["style"]) ? trim($input["style"]) : "None";
$refHistory = isset($input["refHistory"]) ? $input["refHistory"] : null;

if ($apiKey === "") {
    echo json_encode(["success" => false, "message" => "Missing API key"]);
    exit;
}

if ($prompt === "") {
    echo json_encode(["success" => false, "message" => "Missing prompt"]);
    exit;
}

// Prepare FormData payload
$postFields = [
    "prompt" => $prompt,
    "model" => $model,
    "aspect_ratio" => $aspectRatio,
    "style" => $style
];

// Add ref_history if provided
if ($refHistory !== null) {
    $postFields["ref_history"] = $refHistory;
}

$ch = curl_init("https://api.geminigen.ai/uapi/v1/generate_image");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Accept: application/json",
    "x-api-key: ".$apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Return the response
$data = json_decode($response, true);

if ($status === 200) {
    echo json_encode([
        "success" => true,
        "uuid" => $data["uuid"] ?? null,
        "status" => $data["status"] ?? null,
        "message" => $data["status_desc"] ?? "Image generation started"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => $data["detail"]["message"] ?? $data["message"] ?? "Image generation failed",
        "error_code" => $data["detail"]["error_code"] ?? null
    ]);
}
