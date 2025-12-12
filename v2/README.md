# 🎬 GeminiGen Automation Tool V2

**Complete automated script-to-video generation using GeminiGen.AI API**

Deploy at: `https://automation.pillowpotion.com/`

---

## 🚀 What's New in V2

- **4-Page Wizard Flow** - Clear step-by-step process
- **Mandatory Webhook Validation** - Webhook setup required before starting
- **Webhook-Only Generation** - No API polling, all updates via webhooks
- **Pause/Resume/Stop/Restart Controls** - Full control over generation process
- **ZIP Download Support** - Download all images/videos at once
- **Non-Closeable Settings Popups** - Force users to configure before proceeding
- **Real-Time Progress** - Live percentage updates from webhooks
- **Better Error Handling** - Friendly error messages for all GeminiGen error codes

---

## 📋 Architecture

### File Structure

```
v2/
├── index.html                  # Page 1: API & Webhook validation + Script input
├── page2.html                  # Page 2: Scene prompts editing
├── page3.html                  # Page 3: Image generation
├── page4.html                  # Page 4: Video generation
├── styles.css                  # Shared styles for all pages
├── common.js                   # Shared utilities
├── state-manager.js            # LocalStorage state management
├── api-handler.js              # GeminiGen API calls
├── generation-controller.js    # Pause/Resume/Stop/Restart logic
├── download-manager.js         # ZIP download functionality
├── webhook.php                 # Webhook receiver with signature verification
├── webhook-status.php          # Webhook status polling endpoint
├── .htaccess                   # Apache routing configuration
└── webhook-data/               # Storage for webhook results (auto-created)
```

### Flow Diagram

```
Page 1: API Key & Webhook Setup
    ↓
Page 2: Edit Scene Prompts
    ↓
Page 3: Generate Images (Starting + Ending frames)
    ↓
Page 4: Generate Videos (Transitions)
    ↓
Download All
```

---

## 🔧 Setup & Deployment

### Step 1: Upload Files

Upload all files to your web server:

```bash
# Via FTP or SSH
rsync -avz v2/ user@automation.pillowpotion.com:/var/www/html/
```

Or using Git (recommended):

```bash
git clone https://github.com/PillowPotionDiet/automation.git
cd automation/v2
```

### Step 2: Configure Apache

Ensure `.htaccess` is enabled. Your Apache config should have:

```apache
<Directory /var/www/html>
    AllowOverride All
</Directory>
```

Restart Apache:

```bash
sudo systemctl restart apache2
```

### Step 3: Verify Permissions

Ensure PHP can write to webhook-data directory:

```bash
chmod 755 v2/
chmod 755 v2/webhook-data/  # Will be created automatically
```

### Step 4: Configure Webhook on GeminiGen

1. Login to [GeminiGen.ai](https://geminigen.ai)
2. Go to **API Settings**
3. Add webhook URL:
   ```
   https://automation.pillowpotion.com/webhook
   ```
4. Save

### Step 5: Test

1. Open `https://automation.pillowpotion.com/`
2. Enter your API key
3. Confirm webhook configuration
4. Click "Validate & Continue"

---

## 📖 User Guide

### Page 1: Script Input

1. **API Key Validation Popup** (non-closeable)
   - Enter your GeminiGen API key
   - Confirm you've added the webhook URL
   - Click "Validate & Continue"

2. **Script Configuration**
   - Enter your script/story
   - Set number of paragraphs
   - Set scenes per paragraph
   - View estimation of total API requests

3. Click **"Next"** → Goes to Page 2

### Page 2: Scene Prompts

- Review auto-generated scene prompts
- Edit starting/ending frame prompts for each scene
- Click paragraph headers to collapse/expand
- Click **"Next"** → Goes to Page 3

### Page 3: Image Generation

1. **Settings Popup** (non-closeable, appears once)
   - Choose AI Model (Nano Banana Pro is free)
   - Choose Aspect Ratio (16:9 recommended)
   - Choose Artistic Style
   - Enable/disable environment & character consistency locks
   - Click **"Start Image Generation"**

2. **Generation Controls**
   - ⏸️ Pause All - Stop sending new requests
   - ▶️ Resume - Continue from where paused
   - ⏹️ Force Stop - Halt all generation
   - 🔄 Restart - Start over from beginning

3. **Download Options**
   - Download individual images
   - Regenerate any image
   - Download All Images (ZIP)

4. Click **"Next"** when all images done → Goes to Page 4

### Page 4: Video Generation

1. **Settings Popup** (non-closeable, appears once)
   - Choose AI Model (Veo 3.1 Fast recommended)
   - Choose Resolution (1080p recommended)
   - Choose Aspect Ratio
   - Enable/disable consistency locks
   - Click **"Start Video Generation"**

2. **Generation Controls** (same as Page 3)

3. **Download Options**
   - Download individual videos
   - Download individual thumbnails
   - Download All Videos (ZIP)

4. Click **"Finish & Download All"** when done

---

## 🔐 Security

### Webhook Signature Verification

The webhook.php endpoint verifies incoming webhooks using:

```
Signature = MD5(event_uuid) + RSA-SHA256
```

Currently, MD5 verification is implemented. For full RSA verification, you need GeminiGen's public key.

### Protected Directories

`.htaccess` blocks direct access to:
- `webhook-data/` directory

### Auto-Cleanup

Webhook data older than 24 hours is automatically deleted.

---

## ⚙️ API Error Mapping

All GeminiGen error codes are mapped to friendly messages:

| Error Code | Friendly Message |
|-----------|------------------|
| `API_KEY_REQUIRED` | API key missing. |
| `USER_NOT_FOUND` | User account not found. |
| `API_KEY_NOT_FOUND` | Invalid API key. |
| `PREMIUM_PLAN_REQUIRED` | Premium plan required. |
| `NOT_ENOUGH_CREDIT` | You do not have enough credits. |
| `TEXT_TOO_LONG` | Your text exceeds max length. |
| `GEMINI_RATE_LIMIT` | Too many requests. Slow down. |
| `GEMINI_RAI_MEDIA_FILTERED` | Content blocked by safety filters. |
| `SYSTEM_ERROR` | Internal server error. |

---

## 🐛 Troubleshooting

### "404 Not Found" for /webhook

**Problem**: `.htaccess` not working

**Solution**:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### "API Key validation failed"

**Problem**: Proxy not configured

**Solution**: Ensure proxy.php from parent directory is accessible:
```apache
RewriteRule ^api/geminigen/(.*)$ ../proxy.php [L,QSA]
```

### "No webhook data received yet"

**Problem**: Webhook not configured on GeminiGen

**Solution**: Add webhook URL in GeminiGen API Settings:
```
https://automation.pillowpotion.com/webhook
```

### Images/Videos stuck at 0%

**Problem**: Webhook storage directory not writable

**Solution**:
```bash
chmod 755 v2/
mkdir -p v2/webhook-data
chmod 755 v2/webhook-data
```

---

## 📊 State Management

All data is stored in `localStorage`:

- `geminigen_api_key` - API key
- `webhook_configured` - Webhook setup confirmed
- `script_data` - Script and configuration
- `scenes` - Scene prompts
- `image_settings` - Image generation settings
- `video_settings` - Video generation settings
- `generated_images` - Image URLs
- `generated_videos` - Video URLs
- `active_requests` - Current generation queue

---

## 🔄 Webhook Flow

```
1. User clicks "Generate"
   ↓
2. Frontend calls API via proxy.php
   ↓
3. API returns UUID
   ↓
4. Frontend starts polling webhook-status.php
   ↓
5. GeminiGen processes request
   ↓
6. GeminiGen sends webhook to webhook.php
   ↓
7. webhook.php stores data in webhook-data/{uuid}.json
   ↓
8. Frontend polls webhook-status.php
   ↓
9. webhook-status.php returns stored data
   ↓
10. Frontend updates UI with result
```

---

## 💾 Download System

### Individual Downloads

Click "Download" button on any image/video card.

### ZIP Downloads

**Images ZIP**:
- Contains all generated images
- Named as: `scene_X_start.png`, `scene_X_end.png`

**Videos ZIP**:
- Contains all videos + thumbnails
- Named as: `clip_01.mp4`, `clip_01_thumbnail.jpg`

Uses [JSZip](https://stuk.github.io/jszip/) library (loaded dynamically).

---

## 📝 Development

### Adding New Features

1. Shared utilities → `common.js`
2. API calls → `api-handler.js`
3. State persistence → `state-manager.js`
4. Page-specific logic → In respective HTML file

### Testing Locally

```bash
# Start local PHP server
cd v2/
php -S localhost:8000

# Open browser
open http://localhost:8000
```

**Note**: Webhooks won't work locally. Deploy to test webhooks.

---

## 📞 Support

- **Issues**: https://github.com/PillowPotionDiet/automation/issues
- **GeminiGen Docs**: https://geminigen.ai/docs
- **API Reference**: https://api.geminigen.ai/docs

---

## 📜 License

MIT License - See LICENSE file

---

## 🙏 Credits

- **GeminiGen.AI** - Image & Video Generation API
- **JSZip** - ZIP file generation
- **Claude Code** - Development assistance

---

**Built with ❤️ using GeminiGen.AI**
