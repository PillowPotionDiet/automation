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
$systemInstruction = isset($input["systemInstruction"]) ? trim($input["systemInstruction"]) : "";
$model = isset($input["model"]) ? trim($input["model"]) : "gpt-4o-mini";
$temperature = isset($input["temperature"]) ? floatval($input["temperature"]) : 0.7;

if ($apiKey === "") {
    echo json_encode(["success" => false, "message" => "Missing API key"]);
    exit;
}

if ($prompt === "") {
    echo json_encode(["success" => false, "message" => "Missing prompt"]);
    exit;
}

// Build messages array
$messages = [];

if ($systemInstruction !== "") {
    $messages[] = [
        "role" => "system",
        "content" => $systemInstruction
    ];
}

$messages[] = [
    "role" => "user",
    "content" => $prompt
];

// Prepare request body for OpenAI
$requestBody = [
    "model" => $model,
    "messages" => $messages,
    "temperature" => $temperature
];

$ch = curl_init("https://api.openai.com/v1/chat/completions");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer ".$apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestBody));

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Parse response
$data = json_decode($response, true);

if ($status === 200 && isset($data["choices"][0]["message"]["content"])) {
    // OpenAI returns response immediately (no webhook)
    echo json_encode([
        "success" => true,
        "response_text" => $data["choices"][0]["message"]["content"],
        "model" => $data["model"] ?? $model,
        "usage" => $data["usage"] ?? null
    ]);
} else {
    // Error response
    $errorMessage = $data["error"]["message"] ?? "OpenAI request failed";
    echo json_encode([
        "success" => false,
        "message" => $errorMessage,
        "error_code" => $data["error"]["code"] ?? null
    ]);
}
