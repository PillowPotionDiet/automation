# Full Automation Setup Guide
## YouTube Story Generator + VEO Automaton Extension

---

## 🎯 What's New?

**FULL AUTOMATION** - No manual user actions required! When you click "Generate Identities", the system will:

1. ✅ Automatically detect VEO Automaton extension
2. ✅ Automatically send character/environment data to extension
3. ✅ Automatically open Google Labs Flow
4. ✅ Automatically populate prompts in extension
5. ✅ Automatically configure settings
6. ✅ Automatically start generation
7. ✅ Automatically monitor progress
8. ✅ Automatically collect results
9. ✅ Automatically navigate to Page 2

**You only interact with the YouTube Story Generator page!**

---

## 📋 Prerequisites

1. **Chrome/Edge Browser** (Manifest V3 compatible)
2. **VEO Automaton Extension 2.0** (located in `extension 2.0/veo automation extension/`)
3. **YouTube Story Generator** running on localhost or automation.pillowpotion.com

---

## 🔧 Installation Steps

### Step 1: Install VEO Automaton Extension 2.0

1. Open Chrome/Edge browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. Select the folder: `g:\Tool\script-to-video-generator\extension 2.0\veo automation extension\`
6. Verify the extension is loaded and enabled

### Step 2: Verify Extension Installation

1. You should see **"VEO Automation"** in your extensions list
2. Version should be **2.1.6**
3. Status should be **"Enabled"**
4. Check that the extension has these permissions:
   - Storage
   - Tabs
   - Background
   - Side Panel
   - Active Tab
   - Downloads

### Step 3: Open YouTube Story Generator

1. Navigate to your YouTube Story Generator page:
   - **Production**: `https://automation.pillowpotion.com/tools/youtube-story-generator/`
   - **Local**: `http://localhost:5500/public/tools/youtube-story-generator/` (or your local port)

### Step 4: Test the Connection

1. Open browser console (F12 → Console tab)
2. The console should show:
   ```
   [VEO Bridge] Content script bridge loaded
   [VEO Bridge] Bridge initialized and listening for messages
   [VEO Background] Automation handler initialized
   [VEO Background] Handler ready
   ```
3. This confirms the extension is properly connected

---

## 🚀 How to Use (Full Automation)

### Workflow:

```
1. Enter your script
   ↓
2. Select "Storyboard Brain (Local AI)" [Recommended]
   ↓
3. System detects characters & environments
   ↓
4. Click "Generate Identities" button
   ↓
5. SIT BACK AND RELAX! Everything happens automatically:
   - Extension detected ✓
   - Data sent to extension ✓
   - Google Labs Flow opened ✓
   - Extension auto-configured ✓
   - Prompts auto-populated ✓
   - Generation started ✓
   - Progress monitored ✓
   - Results collected ✓
   - Navigation to Page 2 ✓
```

### Step-by-Step:

1. **Enter Script**
   - Go to YouTube Story Generator
   - Paste your story/script
   - Set number of paragraphs and scenes
   - Click **"Next: Lock Identities"**

2. **Select Brain Type**
   - Choose **"Storyboard Brain (Local AI)"** ✅ (Recommended - No API costs)
   - Or **"GeminiGen Brain"** (Uses API credits)
   - Click **"Continue with Selected Brain"**

3. **Setup Method**
   - Choose **"🚀 Go with Extension Automation"** ✅
   - Click **"Continue"**

4. **Processing**
   - System analyzes your script
   - Detects characters with 20+ attributes
   - Detects environments and settings
   - Shows character/environment cards with "Pending Generation" status

5. **Generate Identities** ⚡
   - Click the **"Generate Identities"** button
   - Watch the progress bar:
     ```
     5%   - Checking VEO Automaton extension...
     10%  - Preparing character and environment data...
     15%  - Sending automation request to extension...
     20%  - Opening Google Labs Flow...
     30%  - Opening VEO Automaton side panel...
     40%  - Populating prompts...
     50%  - Configuring extension settings...
     60%  - Starting image generation...
     70%  - Generating images... (~XXs remaining)
     90%  - Collecting generated images...
     100% - Automation complete!
     ```

6. **Automatic Navigation**
   - System automatically navigates to Page 2
   - Generated images metadata is stored
   - You can proceed to configure scenes!

---

## 🧪 Testing Checklist

Use this checklist to verify everything works:

- [ ] Extension installed and enabled in Chrome
- [ ] Console shows bridge initialization messages
- [ ] YouTube Story Generator page loads without errors
- [ ] Can enter script and proceed to brain selection
- [ ] "Extension Automation" option is visible
- [ ] Clicking "Generate Identities" shows progress bar
- [ ] Progress updates appear in real-time
- [ ] Google Labs Flow tab opens automatically
- [ ] VEO Automaton side panel opens automatically
- [ ] Prompts are populated automatically
- [ ] Generation starts automatically
- [ ] Progress is monitored automatically
- [ ] Page navigates to Page 2 automatically

---

## 🔍 Troubleshooting

### Extension Not Detected

**Problem**: "VEO Automaton extension not found" error

**Solutions**:
1. Verify extension is installed: Go to `chrome://extensions/`
2. Verify extension is enabled (toggle switch on)
3. Refresh the YouTube Story Generator page
4. Check console for bridge initialization messages
5. Make sure you're using Chrome/Edge (not Firefox)

### No Progress Updates

**Problem**: Progress bar stuck at 15%

**Solutions**:
1. Check if Google Labs Flow tab opened
2. Look for errors in browser console (F12)
3. Verify extension has required permissions
4. Try disabling/re-enabling the extension
5. Clear browser cache and reload

### Cross-Origin Errors

**Problem**: Console shows CORS or cross-origin errors

**Solutions**:
1. Verify manifest.json includes correct domains:
   ```json
   "host_permissions": [
     "*://labs.google/*",
     "*://automation.pillowpotion.com/*",
     "http://localhost:*/*",
     "<all_urls>"
   ]
   ```
2. Reload extension after manifest changes
3. Use the production URL or localhost (file:// protocol has limitations)

### Images Not Downloading

**Problem**: Automation completes but no images in Downloads

**Solutions**:
1. Check Downloads folder for images
2. Verify extension has "downloads" permission
3. Check Google Labs Flow tab for generation errors
4. Look at browser's download manager (Ctrl+J)
5. Ensure pop-ups aren't blocked

### Automation Stops Mid-Process

**Problem**: Progress stops at specific percentage

**Solutions**:
1. Check console for error messages
2. Verify Google account is logged in at labs.google.com
3. Check if Google Labs Flow has rate limits
4. Ensure stable internet connection
5. Try with fewer characters/environments first

---

## 📊 Architecture Overview

```
┌─────────────────────────────────┐
│  YouTube Story Generator        │
│  (Web Page)                     │
│                                 │
│  • User enters script           │
│  • Storyboard Brain detects     │
│    characters & environments    │
│  • User clicks "Generate"       │
│                                 │
│  google-labs-flow-automator.js  │
│  • Checks extension             │
│  • Sends START_AUTOMATION msg   │
└──────────┬──────────────────────┘
           │ window.postMessage()
           ↓
┌─────────────────────────────────┐
│  VEO Automaton Extension        │
│  (Chrome Extension)             │
│                                 │
│  content-script-bridge.js       │
│  • Listens for messages         │
│  • Validates origin             │
│  • Forwards to background       │
└──────────┬──────────────────────┘
           │ chrome.runtime.sendMessage()
           ↓
┌─────────────────────────────────┐
│  Extension Background Script    │
│  (Service Worker)               │
│                                 │
│  background-automation-handler  │
│  • Opens Google Labs Flow tab   │
│  • Injects prompts              │
│  • Configures settings          │
│  • Starts generation            │
│  • Monitors progress            │
│  • Collects results             │
│  • Sends progress updates       │
└──────────┬──────────────────────┘
           │ chrome.tabs.sendMessage()
           ↓
┌─────────────────────────────────┐
│  Back to Web Page               │
│                                 │
│  • Receives progress updates    │
│  • Updates UI                   │
│  • Navigates to Page 2          │
└─────────────────────────────────┘
```

---

## 🎬 Message Flow

### 1. Extension Check
```
Web Page → Extension
{
  type: 'EXTENSION_CHECK'
}

Extension → Web Page
{
  type: 'EXTENSION_AVAILABLE',
  version: '2.1.6'
}
```

### 2. Start Automation
```
Web Page → Extension
{
  type: 'START_AUTOMATION',
  characters: [...],
  environments: [...]
}

Extension → Web Page
{
  type: 'AUTOMATION_STARTED',
  success: true,
  message: '...'
}
```

### 3. Progress Updates
```
Extension → Web Page
{
  type: 'AUTOMATION_PROGRESS',
  percentage: 50,
  status: 'Generating images...',
  currentItem: 3,
  totalItems: 10
}
```

### 4. Completion
```
Extension → Web Page
{
  type: 'AUTOMATION_COMPLETE',
  success: true,
  images: [...],
  downloadPath: 'Downloads/'
}
```

### 5. Error Handling
```
Extension → Web Page
{
  type: 'AUTOMATION_ERROR',
  error: 'Error message here',
  step: 'populate_prompts'
}
```

---

## 📝 Files Modified/Created

### New Files:
1. ✨ `extension 2.0/veo automation extension/content-script-bridge.js`
   - Bridges web page ↔ extension communication

2. ✨ `extension 2.0/veo automation extension/background-automation-handler.js`
   - Handles full automation workflow in background

### Modified Files:
1. 📝 `public/tools/youtube-story-generator/google-labs-flow-automator.js`
   - Rewritten for full automation (v2.0)
   - Removed manual user action requirements
   - Added message-based communication

2. 📝 `extension 2.0/veo automation extension/manifest.json`
   - Added content-script-bridge.js to content_scripts
   - Added automation.pillowpotion.com to matches
   - Added localhost support for testing
   - Extended host_permissions

3. 📝 `extension 2.0/veo automation extension/service-worker-loader.js`
   - Imported background-automation-handler.js

---

## ⚙️ Configuration Options

### Extension Settings

The extension automatically configures itself, but you can manually adjust:

1. **Concurrent Prompts**: Set to "1 prompt" (automatic)
2. **Tab Selection**: "Text to Image" (automatic)
3. **Download Location**: Uses browser's default Downloads folder

### Web Page Settings

In YouTube Story Generator:

1. **Setup Method**: Choose "Extension Automation"
2. **Brain Type**: Choose "Storyboard Brain" (recommended)
3. **No API key required** for extension automation

---

## 🐛 Debug Mode

To enable detailed logging:

1. Open browser console (F12)
2. All automation steps are logged with prefixes:
   - `[Automator]` - Web page automation controller
   - `[VEO Bridge]` - Content script bridge
   - `[VEO Background]` - Background script handler
   - `[VEO Inject]` - Script injection
   - `[VEO Config]` - Configuration
   - `[VEO Start]` - Generation start
   - `[VEO Monitor]` - Progress monitoring
   - `[VEO Collect]` - Result collection

3. Filter console by prefix to see specific component logs

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ Console shows bridge initialization
2. ✅ "Extension detected" message appears
3. ✅ Progress bar updates smoothly
4. ✅ Google Labs Flow tab opens automatically
5. ✅ VEO extension side panel opens
6. ✅ Prompts appear in extension automatically
7. ✅ "Run" button is clicked automatically
8. ✅ Images download to your Downloads folder
9. ✅ Page navigates to Page 2 automatically
10. ✅ Character/environment cards show "Generated" status

---

## 📞 Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review console logs for error messages
3. Verify all installation steps completed
4. Try with a simple script (1-2 characters) first
5. Ensure Google account is logged in at labs.google.com

---

## 🔄 Version History

### Version 2.0 (Current)
- ✨ Full automation implemented
- ✨ Message bridge between web page and extension
- ✨ Zero manual user actions required
- ✨ Real-time progress updates
- ✨ Automatic error handling

### Version 1.0 (Previous)
- ⚠️ Required manual user actions
- ⚠️ User had to click extension icon
- ⚠️ User had to paste prompts manually
- ⚠️ User had to click Run button manually

---

## ✅ Quick Start Checklist

1. [ ] Install VEO Automaton extension 2.0
2. [ ] Enable extension in Chrome
3. [ ] Open YouTube Story Generator
4. [ ] Check console for bridge messages
5. [ ] Enter your script
6. [ ] Select Storyboard Brain
7. [ ] Choose Extension Automation
8. [ ] Click "Generate Identities"
9. [ ] Watch the magic happen! ✨
10. [ ] Proceed to Page 2 automatically

---

**🎬 Ready to automate your video generation workflow!**
