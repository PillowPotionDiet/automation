# CRX Extraction Summary

## Original File
- **Filename:** `FNMIJGMNJPEALNNADJPJILAANHHAMBEB_2_1_3_0.crx`
- **Size:** 696 KB (712,704 bytes)
- **Format:** Chrome Extension Package (CRX3)
- **Extension ID:** FNMIJGMNJPEALNNADJPJILAANHHAMBEB
- **Status:** ✅ Extracted and deleted

## Extracted To
- **Folder:** `veo-automation-extension/`
- **Type:** Unpacked Chrome Extension (modifiable)

## Extension Details

### Basic Info
- **Name:** VEO Automation - Google Flow AI VEO Automation
- **Version:** 2.1.3.0
- **Author:** kylenguyenaws@gmail.com
- **Manifest:** Version 3

### Purpose
Automates Google Flow AI (Veo, ImageFX, Imagen) for:
- Batch processing multiple prompts
- Auto-downloading generated videos/images
- Organizing downloads into project folders

### Key Files Extracted

```
veo-automation-extension/
├── manifest.json (1.4 KB)
├── service-worker-loader.js (40 bytes)
├── logo.png (114 KB)
├── README.md (new - 8 KB documentation)
│
├── assets/ (compiled bundles)
│   ├── index.html-B-tB0sk2.js (761 KB) - Side Panel UI
│   ├── index.ts-D54SgmvI.js (113 KB) - Content Script
│   ├── index.ts-D8XxzeM2.js (2 KB) - Service Worker
│   ├── index-DafA9wa_.css (53 KB) - Styles
│   └── primeicons-* (fonts)
│
└── src/
    ├── ui/side-panel/index.html
    └── assets/logo.png
```

### Technologies Used
- Vue 3 (Composition API)
- PrimeVue (UI components)
- TypeScript → JavaScript (compiled)
- Vite (bundler)
- Manifest V3

## How to Use

### Install Extension
1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `veo-automation-extension` folder

### Modify Extension
⚠️ **Note:** Files are minified/bundled. For significant changes:
1. Need original TypeScript source code
2. Set up build environment (npm install)
3. Edit source `.ts` and `.vue` files
4. Run `npm run build`
5. Reload extension

### Quick Tweaks (No Build Needed)
- Edit `manifest.json` (name, version, permissions)
- Replace `logo.png`
- Modify HTML structure (limited)

## Permissions
- `storage` - Save settings
- `tabs` - Manage Flow tabs
- `sidePanel` - Side panel UI
- `downloads` - Auto-download files
- `*://labs.google/*` - Access Google Labs

## Next Steps

1. ✅ Extension extracted to modifiable format
2. ✅ Documentation created (README.md)
3. 📝 To modify: Need TypeScript source or edit minified JS
4. 🚀 To use: Load unpacked in Chrome

## Files Removed
- ❌ `FNMIJGMNJPEALNNADJPJILAANHHAMBEB_2_1_3_0.crx` (deleted after extraction)

---

**Extraction Date:** 2026-01-01
**Status:** ✅ Complete
