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

if ($apiKey === "") {
    echo json_encode(["success" => false, "message" => "Missing API key"]);
    exit;
}

// Prepare test body
$body = [
    "input_text" => "Test image generation",
    "model_name" => "imagen-pro",
    "aspect_ratio" => "1:1",
    "style" => "None"
];

$ch = curl_init("https://api.geminigen.ai/uapi/v1/generate_image");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "x-api-key: ".$apiKey
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

$response = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo json_encode([
    "success" => $status === 200,
    "status" => $status,
    "geminigen_raw" => json_decode($response, true)
]);
