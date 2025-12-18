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
$model = isset($input["model"]) ? trim($input["model"]) : "gemini-2.5-pro";
$systemInstruction = isset($input["systemInstruction"]) ? trim($input["systemInstruction"]) : "";
$temperature = isset($input["temperature"]) ? floatval($input["temperature"]) : 0.7;

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
    "temperature" => $temperature
];

// Add system_instruction if provided
if ($systemInstruction !== "") {
    $postFields["system_instruction"] = $systemInstruction;
}

$ch = curl_init("https://api.geminigen.ai/uapi/v1/text/generate");
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
        "message" => "Text generation started"
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => $data["detail"]["message"] ?? $data["message"] ?? "Text generation failed",
        "error_code" => $data["detail"]["error_code"] ?? null
    ]);
}
