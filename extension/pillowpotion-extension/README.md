# PillowPotion - AI Video Automation Extension

## Overview

This Chrome extension automates **Google Flow AI (Veo, ImageFX, Imagen)** for batch processing multiple prompts and downloading videos/images.

**Version:** 3.0.0
**Website:** https://automation.pillowpotion.com/public/

---

## Features

✅ **Batch Processing** - Process multiple prompts simultaneously
✅ **Auto Download** - Automatically download generated videos and images
✅ **Side Panel UI** - Built-in side panel interface for control
✅ **Project Organization** - Organize downloads into project folders
✅ **Zoom Control** - Set custom zoom levels for Flow interface
✅ **Tab Management** - Auto-reload Flow tabs on install/update

---

## Extension Structure

```
pillowpotion-extension/
├── manifest.json                     # Extension configuration
├── service-worker-loader.js          # Background service worker loader
├── logo.png                          # Extension icon (114 KB)
│
├── assets/                           # Compiled/bundled assets
│   ├── index.html-B-tB0sk2.js       # Side panel UI (761 KB - minified)
│   ├── index.ts-D54SgmvI.js         # Content script (113 KB - minified)
│   ├── index.ts-D8XxzeM2.js         # Service worker (2 KB - minified)
│   ├── index-DafA9wa_.css           # Side panel styles (53 KB)
│   └── primeicons-*.{woff,woff2,ttf,eot,svg}  # PrimeVue icon fonts
│
├── src/
│   ├── ui/side-panel/
│   │   └── index.html               # Side panel HTML entry
│   └── assets/
│       └── logo.png                 # Logo asset
│
└── _metadata/
    └── verified_contents.json       # Chrome Web Store verification
```

---

## Permissions Explained

| Permission | Purpose |
|------------|---------|
| `storage` | Save user settings and project configurations |
| `tabs` | Manage Flow tabs (reload, activate, zoom) |
| `background` | Run service worker for automation tasks |
| `sidePanel` | Display control panel in Chrome sidebar |
| `activeTab` | Access current tab for automation |
| `downloads` | Auto-download generated videos/images |
| `*://labs.google/*` | Access Google Labs (Flow, ImageFX, Veo) |

---

## How It Works

### 1. **Background Service Worker** (`index.ts-D8XxzeM2.js`)

**Key Functions:**
- **Side Panel Setup** - Initializes side panel on install
- **Tab Management** - Reloads Flow tabs on update
- **Download Handler** - Manages video/image downloads with custom filenames
- **Project Folders** - Organizes downloads by project name
- **Message Passing** - Handles communication between UI and content scripts

**Message Types:**
```javascript
SET_ZOOM          // Adjust zoom level of Flow page
DOWNLOAD_VIDEO    // Download video with custom filename/folder
SET_PROJECT_NAME  // Set current project folder name
```

### 2. **Content Script** (`index.ts-D54SgmvI.js`)

Injected into `*://labs.google/*` pages to:
- Monitor Flow UI for generation status
- Extract generated image/video URLs
- Trigger downloads automatically
- Communicate with side panel

### 3. **Side Panel UI** (`index.html-B-tB0sk2.js`)

Built with **PrimeVue** (Vue 3 component library):
- Input area for multiple prompts
- Control buttons (start, stop, pause)
- Progress tracking
- Download management
- Settings configuration

---

## Installation

### Method 1: Load Unpacked (Developer Mode)

1. Open Chrome/Edge
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `pillowpotion-extension` folder
6. Extension is now installed!

### Method 2: Build & Package (Optional)

To create a new `.crx` file after modifications:

```bash
# Package the extension (requires Chrome)
chrome --pack-extension=pillowpotion-extension
```

---

## Usage

1. **Navigate to Google Flow**
   Go to https://labs.google/fx/tools/flow or any Google AI tool

2. **Open Side Panel**
   Click the extension icon or it opens automatically

3. **Add Prompts**
   Enter multiple prompts in the side panel

4. **Set Project Name** (Optional)
   Organize downloads into folders

5. **Start Automation**
   Click "Start" to begin batch processing

6. **Auto-Download**
   Generated videos/images download automatically to your configured folder

---

## Development Notes

### Files are Minified/Bundled

⚠️ **Important:** The current files are production builds (minified, bundled). To modify functionality:

1. You need the **source code** (TypeScript/Vue files)
2. The build process likely uses:
   - **Vite** (build tool - see hash-based filenames)
   - **Vue 3** + **TypeScript**
   - **PrimeVue** (UI components)

### Modifying This Extension

**Option 1: Direct Modification** (Not Recommended)
- Edit minified `.js` files directly (very difficult)

**Option 2: Rebuild from Source** (Recommended)
- Get original TypeScript source code
- Modify `.ts` and `.vue` files
- Run build process (`vite build`)
- Replace assets with new builds

### Source Project Structure (Typical)

The original unbundled source likely looked like:
```
src/
├── background/
│   └── index.ts           → Compiled to: index.ts-D8XxzeM2.js
├── content/
│   └── index.ts           → Compiled to: index.ts-D54SgmvI.js
├── ui/side-panel/
│   ├── index.html
│   ├── App.vue
│   ├── main.ts            → Compiled to: index.html-B-tB0sk2.js
│   └── components/
│       └── *.vue
└── assets/
    └── logo.png
```

---

## Customization Guide

### Change Extension Name/Description

Edit `manifest.json`:
```json
{
  "name": "Your Custom Name",
  "description": "Your custom description",
  "version": "2.2.0"
}
```

### Add New Permissions

Edit `manifest.json` → `permissions` array:
```json
"permissions": [
  "storage",
  "tabs",
  "clipboardWrite"  // ← Add new permissions
]
```

### Modify Download Folder Structure

Edit the minified service worker or wait for source code to modify download path logic.

---

## Debugging

### View Extension Logs

1. Go to `chrome://extensions/`
2. Find "PillowPotion"
3. Click **Inspect views: service worker**
4. Console will show background script logs

### Debug Content Script

1. Open Flow page
2. Press `F12` (DevTools)
3. Go to **Console** tab
4. Logs from content script appear here

### Debug Side Panel

1. Open side panel
2. Right-click inside panel
3. Select **Inspect**
4. DevTools for side panel opens

---

## Tech Stack

- **Manifest Version:** 3 (latest Chrome extension format)
- **Frontend Framework:** Vue 3 (with Composition API)
- **UI Library:** PrimeVue (icons, components)
- **Build Tool:** Vite (hash-based bundling)
- **Language:** TypeScript (compiled to JavaScript)
- **Fonts:** PrimeIcons (for UI icons)

---

## Known Limitations

⚠️ **Minified Code** - Hard to modify without source
⚠️ **No Source Maps** - Debugging is difficult
⚠️ **Build Process Unknown** - Need original `vite.config.ts` or `package.json`

---

## Next Steps

### To Make Modifications:

1. **Get Source Code** - Obtain TypeScript/Vue source files
2. **Set Up Dev Environment:**
   ```bash
   npm install
   npm run dev      # Development mode
   npm run build    # Production build
   ```
3. **Modify Source** - Edit `.ts` and `.vue` files
4. **Rebuild** - Run build command
5. **Reload Extension** - Click reload in `chrome://extensions/`

---

## Version History

- **3.0.0** - PillowPotion Rebrand
  - Rebranded to PillowPotion
  - Updated all branding and references
  - Removed multi-language support (English only)
  - Enhanced automation features

- **2.1.3** - Previous version
  - Side panel UI
  - Batch processing
  - Auto-download
  - Project folder organization

---

## License

All rights reserved - PillowPotion

---

## Support

For issues or questions, visit: **https://automation.pillowpotion.com/public/**
