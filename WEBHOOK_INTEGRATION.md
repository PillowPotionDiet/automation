# 📡 Webhook Integration Guide

## Overview

The Script-to-Video Generator now includes a complete webhook notification system that sends real-time HTTP POST requests to your configured endpoint when generation events occur.

---

## Features

### ✅ Implemented Features

1. **Webhook Configuration UI**
   - Webhook URL input with validation
   - Optional secret for HMAC-SHA256 signature verification
   - Toggle visibility for secret field
   - Status indicator showing active webhook

2. **Event Subscriptions**
   - IMAGE_GENERATION_COMPLETED
   - IMAGE_GENERATION_FAILED
   - VIDEO_GENERATION_COMPLETED
   - VIDEO_GENERATION_FAILED
   - ALL_GENERATIONS_COMPLETED

3. **Security**
   - HMAC-SHA256 signature generation using user-provided secret
   - Signature sent in `X-Webhook-Signature` header
   - Payload integrity verification

4. **Testing & Validation**
   - Test webhook button to verify endpoint connectivity
   - URL format validation
   - Status indicators and logging

5. **Automatic Notifications**
   - Integrated into all generation functions
   - Non-blocking (failures don't stop generation)
   - Detailed event data in payloads

---

## Setup Instructions

### 1. Configure Webhook URL

In the web interface:

1. Navigate to the **📡 Webhook Notifications** section
2. Enter your webhook endpoint URL (must be publicly accessible)
   - Example: `https://your-server.com/api/webhooks/script-to-video`
3. (Optional) Enter a webhook secret for signature verification
4. Click **💾 Save Configuration**

### 2. Test Your Webhook

1. Click **🧪 Test Webhook** button
2. Your endpoint should receive a test payload:
   ```json
   {
     "event": "WEBHOOK_TEST",
     "timestamp": "2025-12-12T10:30:00.000Z",
     "data": {
       "message": "This is a test webhook from Script-to-Video Generator",
       "test": true
     }
   }
   ```
3. Respond with HTTP 200-299 status to confirm receipt

### 3. Select Events

Check/uncheck which events you want to receive:
- ✅ Image generation completed
- ✅ Image generation failed
- ✅ Video generation completed
- ✅ Video generation failed
- ✅ All generations completed

---

## Webhook Payload Formats

### IMAGE_GENERATION_COMPLETED

```json
{
  "event": "IMAGE_GENERATION_COMPLETED",
  "timestamp": "2025-12-12T10:30:15.000Z",
  "data": {
    "sceneId": "p0_s1",
    "frameType": "start",
    "imageUrl": "https://storage.geminigen.ai/images/xyz123.jpg",
    "paragraphIndex": 0,
    "sceneIndex": 1
  }
}
```

### IMAGE_GENERATION_FAILED

```json
{
  "event": "IMAGE_GENERATION_FAILED",
  "timestamp": "2025-12-12T10:30:20.000Z",
  "data": {
    "sceneId": "p0_s2",
    "frameType": "end",
    "error": "Rate limit exceeded",
    "paragraphIndex": 0,
    "sceneIndex": 2
  }
}
```

### VIDEO_GENERATION_COMPLETED

```json
{
  "event": "VIDEO_GENERATION_COMPLETED",
  "timestamp": "2025-12-12T10:35:00.000Z",
  "data": {
    "sceneId": "p0_s1",
    "videoType": "scene",
    "videoUrl": "https://storage.geminigen.ai/videos/abc456.mp4",
    "paragraphIndex": 0,
    "sceneIndex": 1
  }
}
```

### VIDEO_GENERATION_FAILED

```json
{
  "event": "VIDEO_GENERATION_FAILED",
  "timestamp": "2025-12-12T10:35:30.000Z",
  "data": {
    "sceneId": "p1_s0",
    "videoType": "transition",
    "error": "Video generation timeout",
    "paragraphIndex": 1,
    "sceneIndex": 0
  }
}
```

### ALL_GENERATIONS_COMPLETED

```json
{
  "event": "ALL_GENERATIONS_COMPLETED",
  "timestamp": "2025-12-12T10:40:00.000Z",
  "data": {
    "totalImages": 18,
    "totalVideos": 12,
    "totalTime": 600,
    "message": "All image and video generations completed successfully"
  }
}
```

---

## Signature Verification

### How Signatures Work

When you configure a webhook secret, every webhook request includes an `X-Webhook-Signature` header containing an HMAC-SHA256 signature of the payload.

**Signature Generation Process:**
1. Convert payload to JSON string
2. Compute HMAC-SHA256 using your secret as the key
3. Encode signature as hexadecimal
4. Send in `X-Webhook-Signature` header

### Verification Example (Node.js)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
    // Create HMAC
    const hmac = crypto.createHmac('sha256', secret);

    // Compute signature of payload
    const payloadString = JSON.stringify(payload);
    const computedSignature = hmac.update(payloadString).digest('hex');

    // Compare signatures (timing-safe)
    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(computedSignature, 'hex')
    );
}

// Express middleware example
app.post('/api/webhooks/script-to-video', (req, res) => {
    const signature = req.headers['x-webhook-signature'];
    const payload = req.body;
    const secret = process.env.WEBHOOK_SECRET;

    if (!verifyWebhookSignature(payload, signature, secret)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook...
    console.log('Received event:', payload.event);

    res.status(200).json({ received: true });
});
```

### Verification Example (Python)

```python
import hmac
import hashlib
import json

def verify_webhook_signature(payload: dict, signature: str, secret: str) -> bool:
    # Convert payload to JSON string
    payload_string = json.dumps(payload, separators=(',', ':'))

    # Compute HMAC-SHA256
    computed_signature = hmac.new(
        secret.encode('utf-8'),
        payload_string.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Timing-safe comparison
    return hmac.compare_digest(signature, computed_signature)

# Flask example
@app.route('/api/webhooks/script-to-video', methods=['POST'])
def webhook_handler():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.json
    secret = os.environ.get('WEBHOOK_SECRET')

    if not verify_webhook_signature(payload, signature, secret):
        return jsonify({'error': 'Invalid signature'}), 401

    # Process webhook...
    print(f"Received event: {payload['event']}")

    return jsonify({'received': True}), 200
```

---

## Best Practices

### 1. Security

- **Always use HTTPS** for your webhook endpoint
- **Use a strong webhook secret** (32+ random characters)
- **Verify signatures** on your server to prevent spoofing
- **Validate payload structure** before processing
- **Rate limit** your webhook endpoint to prevent abuse

### 2. Reliability

- **Respond quickly** - acknowledge receipt with 200 status immediately
- **Process asynchronously** - handle heavy processing in background jobs
- **Implement retries** - webhooks are sent once; implement your own retry logic if needed
- **Log all webhooks** - maintain audit trail for debugging

### 3. Error Handling

- **Return 200-299** for successful receipt (even if processing fails later)
- **Return 4xx/5xx** only for permanent failures
- **Don't block** - failed webhooks are logged but don't stop generation

### 4. Testing

- Use tools like [webhook.site](https://webhook.site) for testing
- Use [ngrok](https://ngrok.com) to expose local servers for development
- Test with the **🧪 Test Webhook** button before going live

---

## Use Cases

### 1. Email Notifications

Send email alerts when generation completes:
```javascript
app.post('/webhook', async (req, res) => {
    const { event, data } = req.body;

    if (event === 'ALL_GENERATIONS_COMPLETED') {
        await sendEmail({
            to: 'user@example.com',
            subject: 'Video Generation Complete',
            body: `Generated ${data.totalImages} images and ${data.totalVideos} videos in ${data.totalTime}s`
        });
    }

    res.sendStatus(200);
});
```

### 2. Database Logging

Track generation history in your database:
```javascript
app.post('/webhook', async (req, res) => {
    const { event, timestamp, data } = req.body;

    await db.webhookLogs.insert({
        event,
        timestamp,
        data,
        receivedAt: new Date()
    });

    res.sendStatus(200);
});
```

### 3. Slack/Discord Notifications

Post updates to team chat:
```javascript
app.post('/webhook', async (req, res) => {
    const { event, data } = req.body;

    if (event.includes('FAILED')) {
        await postToSlack({
            channel: '#alerts',
            text: `⚠️ Generation failed: ${data.error}`
        });
    }

    res.sendStatus(200);
});
```

### 4. Workflow Automation

Trigger downstream processes:
```javascript
app.post('/webhook', async (req, res) => {
    const { event, data } = req.body;

    if (event === 'VIDEO_GENERATION_COMPLETED') {
        // Trigger video processing pipeline
        await videoProcessor.addToQueue({
            videoUrl: data.videoUrl,
            sceneId: data.sceneId
        });
    }

    res.sendStatus(200);
});
```

---

## Troubleshooting

### Webhook Not Received

1. **Check URL** - Ensure endpoint is publicly accessible
2. **Check firewall** - Verify no firewall blocking requests
3. **Check CORS** - Webhooks don't use CORS, but check network logs
4. **Check logs** - Look at generation log for webhook send attempts

### Signature Verification Fails

1. **Check secret** - Ensure secret matches exactly
2. **Check payload** - Signature is computed on exact JSON string
3. **Check encoding** - Use UTF-8 encoding
4. **Check timing** - Use timing-safe comparison

### Webhook Timeout

1. **Respond quickly** - Return 200 status within 10 seconds
2. **Process async** - Handle heavy work in background
3. **Check endpoint** - Ensure server is responsive

---

## Implementation Details

### Files Modified

1. **webhook-manager.js** (NEW)
   - Complete webhook management class
   - Signature generation
   - Event notification methods

2. **index.html**
   - Webhook configuration UI
   - Event subscription checkboxes

3. **styles-minimal.css**
   - Webhook section styling

4. **app.js**
   - Webhook manager initialization
   - Event listener setup
   - Integration into generation functions

### Key Functions

**WebhookManager.js:**
- `configure(url, secret)` - Set webhook configuration
- `testWebhook()` - Send test notification
- `notifyImageGenerated(...)` - Image success notification
- `notifyImageFailed(...)` - Image failure notification
- `notifyVideoGenerated(...)` - Video success notification
- `notifyVideoFailed(...)` - Video failure notification
- `notifyAllComplete(...)` - All complete notification
- `generateSignature(payload)` - HMAC-SHA256 signature

**app.js:**
- `saveWebhookConfig()` - Save webhook settings
- `testWebhookConnection()` - Test webhook endpoint
- `showWebhookInfo()` - Show webhook documentation
- `updateWebhookStatus()` - Update UI status indicator

---

## Future Enhancements

### Potential Improvements:

1. **Retry Logic**
   - Automatic retries on failure (3 attempts)
   - Exponential backoff

2. **Webhook History**
   - UI showing recent webhook deliveries
   - Success/failure status per webhook

3. **Advanced Filtering**
   - Filter by paragraph/scene
   - Custom event conditions

4. **Batch Notifications**
   - Group multiple events into single webhook
   - Reduce HTTP overhead

5. **Webhook Headers**
   - Custom headers configuration
   - Authentication tokens

6. **Multiple Endpoints**
   - Support multiple webhook URLs
   - Different URLs for different events

---

## Support

For issues or questions:
- Check the generation log for webhook send attempts
- Use the **🧪 Test Webhook** button to verify connectivity
- Click **ℹ️ Info** for quick reference guide

---

**System Status:** ✅ Webhook integration complete and fully functional
