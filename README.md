# 🎬 AI Script-to-Video Generator

A professional web application that transforms written scripts into AI-generated videos through a multi-step process with detailed progress tracking, regeneration capabilities, and consistency controls.

**Powered by GeminiGen.ai - Veo 3.1 Fast & Nano Banana Pro**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [API Setup](#api-setup)
- [Usage Guide](#usage-guide)
- [Consistency Controls](#consistency-controls)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Functionality
- ✅ **Script-to-Video Conversion**: Automatically transform written scripts into AI-generated videos
- ✅ **Multi-Step Workflow**: Guided process from script input to final video output
- ✅ **Intelligent Scene Splitting**: Automatic paragraph and scene detection
- ✅ **Frame Generation**: Creates start and end frames for each scene
- ✅ **Video Transitions**: Generates smooth transitions between scenes
- ✅ **Video Stitching**: Combines individual clips into cohesive paragraph videos

### Consistency Controls ⭐
- 🌍 **Environment Lock**: Maintain consistent settings, lighting, and atmosphere across all scenes
- 👤 **Character Lock**: Keep character appearance identical throughout the video
- 📸 **Reference Image Support**: Upload character references for better consistency
- 🎯 **Seed-Based Generation**: Uses consistent seeds for reproducible results

### User Experience
- 📊 **Real-Time Progress Tracking**: Live statistics dashboard with detailed metrics
- 🔄 **Regeneration Capability**: Regenerate individual images or videos
- 📜 **Generation Log**: Comprehensive logging with export functionality
- 🚦 **Rate Limit Management**: Automatic handling of API rate limits
- 💾 **Auto-Save**: Preserves your work in browser storage
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### API Management
- 🔑 **Secure API Key Storage**: Browser-based secure storage
- ⚡ **Connection Testing**: Verify API connectivity before generation
- 📈 **Usage Tracking**: Monitor API quota across multiple time windows
- ⏱️ **Smart Rate Limiting**: Automatic waiting when limits are approached

---

## 🛠️ Tech Stack

- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Vanilla JavaScript with async/await
- **GeminiGen.ai API**: Image and video generation
- **LocalStorage**: Client-side data persistence

**No frameworks or build tools required!** Pure client-side application.

---

## 📦 Prerequisites

### Required
1. **Web Browser**: Modern browser with JavaScript enabled
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

2. **GeminiGen.ai API Key**:
   - Sign up at [geminigen.ai](https://geminigen.ai)
   - Subscribe to **API Max** plan ($10/3 days)
   - Get your API key from the dashboard

### API Max Plan Details
- **Cost**: $10 per 3 days
- **Total Requests**: 3,000 requests
- **Rate Limits**:
  - 20 requests per minute
  - 200 requests per hour
  - 2,000 requests per day

---

## 🚀 Installation & Deployment

### Important: CORS Fix Required

GeminiGen.AI API blocks direct browser requests due to CORS restrictions. You **must** deploy a backend proxy.

### Quick Deployment (2 Minutes) ⚡

**Recommended: PHP Proxy** (No Node.js required)

1. Clone the repository:
```bash
git clone https://github.com/PillowPotionDiet/automation.git
cd automation
```

2. Upload to your web server:
   - Upload all files to `public_html` or `www`
   - Rename `.htaccess-example` to `.htaccess`

3. That's it! Open your site in browser.

📖 **Detailed Guide**: See [PHP_PROXY_SETUP.md](PHP_PROXY_SETUP.md)

---

### Alternative: Node.js Proxy

If you prefer Node.js:

1. Clone and install:
```bash
git clone https://github.com/PillowPotionDiet/automation.git
cd automation
npm install
```

2. Start the proxy:
```bash
npm start
# OR with PM2:
pm2 start backend-proxy-example.js --name geminigen-proxy
```

📖 **Detailed Guide**: See [PROXY_SETUP.md](PROXY_SETUP.md)

---

### Local Development (File Protocol)

**⚠️ Local files won't work due to CORS!**

For local testing without a server:
1. Use a local web server: `python -m http.server 8000`
2. Open `http://localhost:8000`
3. OR deploy to a hosting service

---

### Deployment Checklist

- [ ] Clone repository
- [ ] Deploy backend proxy (PHP or Node.js)
- [ ] Upload frontend files
- [ ] Test: Open site and click "Test Connection"
- [ ] Enter API key and verify ✅ "API connection successful!"

📖 **Quick Start**: See [DEPLOY_INSTRUCTIONS.md](DEPLOY_INSTRUCTIONS.md)
cd script-to-video-generator
```

Then open `index.html` in your browser.

### Option 3: Local Server (Recommended)

For best results, serve the application through a local web server:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js:**
```bash
npx http-server -p 8000
```

**Using PHP:**
```bash
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

---

## 🔑 API Setup

### Step 1: Get Your API Key

1. Visit [geminigen.ai](https://geminigen.ai)
2. Create an account or log in
3. Navigate to API settings
4. Subscribe to **API Max** plan
5. Copy your API key

### Step 2: Configure Application

1. Open the application in your browser
2. Locate the **API Configuration** section
3. Paste your API key in the input field
4. Click the eye icon (👁️) to toggle visibility
5. Click **Test Connection** button
6. Wait for ✅ **Connected** status

### Step 3: Verify Setup

Once connected, you should see:
- Green connection indicator
- API Usage section appears
- Generate button becomes enabled

---

## 📖 Usage Guide

### Basic Workflow

#### **Step 1: Enter Your Script**

1. Type or paste your script in the text area
2. Use double line breaks to separate scenes naturally
3. Configure settings:
   - **Paragraphs**: Number of main sections (1-50)
   - **Scenes per paragraph**: Scenes within each section (1-10)
4. Review the calculation display for total scenes and API requests

**Example Script:**
```
A sunny beach with golden sand and turquoise waves.

A woman walks along the shore, leaving footprints in the sand.

She picks up a beautiful seashell and smiles at the camera.

The sun sets over the horizon, painting the sky in orange and pink.
```

#### **Step 2: Configure Consistency (Optional)**

**Environment Lock** 🌍
- Enable to maintain consistent setting across all scenes
- Specify: lighting, time of day, weather, location
- Example: "Sunny beach at golden hour with calm ocean waves"

**Character Lock** 👤
- Enable to keep character appearance identical
- Specify: age, gender, hair, clothing, features
- Example: "Young woman, 25 years old, long brown hair, white flowing dress, blue eyes"
- Optionally upload a reference image for better consistency

#### **Step 3: Generate**

1. Click **🚀 Generate Images & Videos**
2. Review the script breakdown
3. Click **✓ Approve** to confirm
4. Review frame definitions
5. Click **✓ Approve & Generate** to start

#### **Step 4: Monitor Progress**

Watch the Statistics Dashboard for:
- Overall progress percentage
- Images generated (X / Y)
- Videos generated (X / Y)
- Time elapsed and remaining
- API usage and rate limits

Check the Generation Log for detailed updates.

#### **Step 5: Review & Download**

**Images Tab:**
- View generated start and end frames
- Click 🔍 to view full size
- Click 🔄 to regenerate specific frames

**Videos Tab:**
- **Row 1**: Individual scene videos (start → end)
- **Row 2**: Transition videos (scene → scene)
- **Row 3**: Final stitched paragraph video
- Click ⬇️ to download individual videos
- Click 📦 to download all clips as ZIP

---

## 🎯 Consistency Controls

### Environment Lock 🌍

**When to use:**
- Your story takes place in a single location
- You want consistent lighting throughout
- Time of day should remain constant

**How it works:**
- Appends environment description to every image prompt
- Maintains same background, lighting, and atmosphere
- Ensures visual continuity across scenes

**Example Descriptions:**
- "Sunny beach at sunset with calm ocean and golden light"
- "Rainy city street at night with neon lights and wet pavement"
- "Cozy café interior with warm lighting and wooden furniture"

### Character Lock 👤

**When to use:**
- Same character appears in multiple scenes
- You need consistent character appearance
- Character is central to your story

**How it works:**
- Appends detailed character description to every image prompt
- Uses consistent seed for reproducible results
- Optional reference image for enhanced consistency

**Example Descriptions:**
- "Young woman, 25 years old, long brown hair, white flowing dress, blue eyes, fair skin"
- "Elderly man, 70s, gray beard, brown suit, glasses, kind expression"
- "Child, 8 years old, short blonde hair, red t-shirt, jeans, sneakers"

**Pro Tips:**
- Be extremely specific (hair length, exact clothing, facial features)
- Include skin tone, eye color, distinctive features
- Upload a reference image for best results
- Describe the same outfit for all scenes

---

## 🏗️ Architecture

### File Structure

```
script-to-video-generator/
│
├── index.html              # Main HTML structure
├── styles.css              # Complete styling and responsive design
│
├── app.js                  # Main application logic and workflow
├── utils.js                # Helper functions and utilities
├── api-client.js           # GeminiGen API integration
├── rate-limiter.js         # Rate limiting and quota management
├── consistency-manager.js  # Environment/character consistency
└── video-stitcher.js       # Video stitching and playlist
```

### Component Overview

**app.js**
- Application state management
- User interface logic
- Generation workflow orchestration
- Event handling

**api-client.js**
- Flexible API endpoint discovery
- Image generation
- Video generation
- Job polling for async operations
- Error handling

**rate-limiter.js**
- Multi-window rate limiting (minute/hour/day)
- Total quota tracking
- Automatic waiting for rate limits
- Usage statistics

**consistency-manager.js**
- Environment lock management
- Character lock management
- Prompt enhancement
- Reference image handling
- Seed management

**video-stitcher.js**
- Video playlist creation
- Enhanced video player
- Download management
- Metadata extraction

**utils.js**
- Toast notifications
- Time formatting
- String utilities
- DOM helpers
- File operations
- LocalStorage helpers

---

## 🔧 Troubleshooting

### Connection Issues

**Problem**: "Connection test failed"
- ✅ Verify API key is correct
- ✅ Check internet connection
- ✅ Ensure API subscription is active
- ✅ Try copying and re-pasting the API key
- ✅ Check browser console for errors

**Problem**: "Invalid API key"
- ✅ Confirm key from GeminiGen.ai dashboard
- ✅ Check for extra spaces or characters
- ✅ Ensure subscription hasn't expired
- ✅ Try generating a new API key

### Generation Issues

**Problem**: "Rate limit exceeded"
- ⏱️ Wait for the indicated time (shown in log)
- ⏱️ The app will automatically wait and retry
- ⏱️ Check usage in Statistics Dashboard
- ⏱️ Consider reducing scenes per paragraph

**Problem**: "Image generation failed"
- 🔄 App automatically retries up to 3 times
- 🔄 Check network connection
- 🔄 Try regenerating individual frames
- 🔄 Simplify prompts if they're very complex

**Problem**: "Video generation timeout"
- ⏰ Videos take 30-60 seconds each
- ⏰ Ensure stable internet connection
- ⏰ Try regenerating the specific video
- ⏰ Check API status page

### Consistency Issues

**Problem**: "Characters look different across scenes"
- 👤 Enable Character Lock
- 👤 Provide very detailed description
- 👤 Upload a reference image
- 👤 Use the same seed (handled automatically)
- 👤 Be specific about every detail

**Problem**: "Environments don't match"
- 🌍 Enable Environment Lock
- 🌍 Be specific about lighting, time, weather
- 🌍 Include location details
- 🌍 Mention specific colors and atmosphere

### Browser Issues

**Problem**: "Page not loading properly"
- 🔄 Hard refresh (Ctrl+F5 or Cmd+Shift+R)
- 🔄 Clear browser cache
- 🔄 Try different browser
- 🔄 Disable browser extensions
- 🔄 Check JavaScript is enabled

**Problem**: "Videos won't play"
- 🎥 Ensure browser supports H.264/MP4
- 🎥 Update browser to latest version
- 🎥 Try downloading and playing locally
- 🎥 Check video URL is accessible

---

## ❓ FAQ

### General Questions

**Q: How much does it cost to generate a video?**
A: With API Max ($10/3 days, 3000 requests), cost depends on your usage. A typical 9-scene video uses ~27 requests (2 images + 1 video per scene), allowing ~110 videos per subscription.

**Q: How long does generation take?**
A: Images: 10-15 seconds each. Videos: 30-60 seconds each. A 9-scene project takes approximately 15-20 minutes total.

**Q: Can I save my progress?**
A: Yes! The app auto-saves to browser LocalStorage. Your API key, script, and settings are preserved.

**Q: Do I need to install anything?**
A: No! It's a pure client-side web application. Just open index.html in a browser.

### Technical Questions

**Q: Can I use a different API?**
A: The code is designed for GeminiGen.ai but can be adapted. Modify `api-client.js` to integrate other APIs.

**Q: Is my API key secure?**
A: Your API key is stored in browser LocalStorage only. It never leaves your computer except to make API requests.

**Q: Can I run this offline?**
A: No, it requires internet connection for API calls. However, the app files work offline - only generation needs internet.

**Q: What video formats are supported?**
A: The API generates MP4 (H.264) videos, compatible with all modern browsers and devices.

### Feature Questions

**Q: Can I edit scenes after generation?**
A: Yes! Use the 🔄 Regenerate button on any image or video to recreate it with the same or modified settings.

**Q: How does video stitching work?**
A: Currently uses playlist-based playback. For true video merging, you'd need FFmpeg.js (see video-stitcher.js comments for implementation).

**Q: Can I export my script breakdown?**
A: Yes, use the "Export Log" button to save all generation details and timestamps.

**Q: What's the maximum script length?**
A: No hard limit, but consider API quota. Each scene uses 2-3 requests. 50 scenes = ~150 requests.

---

## 🎨 Customization

### Modify Visual Style

Edit `styles.css` to customize:
- Color scheme (CSS variables at top)
- Font families
- Card shadows and effects
- Responsive breakpoints

### Adjust API Parameters

In `api-client.js`, modify:
- Image model: `this.models.image = 'your-model'`
- Video model: `this.models.video = 'your-model'`
- Default aspect ratio, quality, duration
- Endpoint URLs

### Change Rate Limits

In `rate-limiter.js`, adjust:
```javascript
this.limits = {
    minute: 20,
    hour: 200,
    day: 2000
};
this.maxTotal = 3000;
```

---

## 📊 Browser Compatibility

| Browser | Minimum Version | Recommended |
|---------|----------------|-------------|
| Chrome  | 90+            | Latest      |
| Firefox | 88+            | Latest      |
| Safari  | 14+            | Latest      |
| Edge    | 90+            | Latest      |

**Required Features:**
- ES6+ JavaScript
- Fetch API
- LocalStorage
- Async/await
- CSS Grid & Flexbox

---

## 🐛 Known Limitations

1. **Video Stitching**: Current implementation uses playlists rather than true video merging. For production-grade stitching, integrate FFmpeg.js.

2. **Browser Storage**: LocalStorage has ~5-10MB limit. Large projects may need IndexedDB.

3. **Large Files**: Downloading many videos simultaneously may be memory-intensive.

4. **API Variations**: GeminiGen.ai API endpoints may vary. The app tries multiple patterns but may need updates.

---

## 🚀 Future Enhancements

- [ ] True video stitching with FFmpeg.js
- [ ] Server-side rendering option
- [ ] Batch processing for large scripts
- [ ] Advanced editing features
- [ ] Audio/music integration
- [ ] Multiple API provider support
- [ ] Project import/export
- [ ] Template library
- [ ] Collaboration features

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

```
MIT License

Copyright (c) 2024 Script-to-Video Generator

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/script-to-video-generator/issues)
- **Email**: support@example.com
- **Documentation**: This README
- **API Support**: [GeminiGen.ai Support](https://geminigen.ai/support)

---

## 🙏 Acknowledgments

- **GeminiGen.ai** for providing the AI generation API
- **Veo 3.1 Fast** video generation model
- **Nano Banana Pro** image generation model
- All open-source contributors

---

## 📝 Changelog

### Version 1.0.0 (2024-12-12)

**Initial Release**
- ✅ Complete script-to-video workflow
- ✅ Environment and character consistency controls
- ✅ Real-time progress tracking
- ✅ Rate limiting and quota management
- ✅ Regeneration capabilities
- ✅ Responsive design
- ✅ Comprehensive logging
- ✅ Video playlist player

---

**Made with ❤️ for content creators**

Transform your scripts into stunning AI-generated videos with ease!
