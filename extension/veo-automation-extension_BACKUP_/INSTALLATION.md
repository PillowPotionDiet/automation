# Quick Installation Guide

## Install VEO Automation Extension in Chrome/Edge

### Step 1: Open Extensions Page

**Chrome:**
```
chrome://extensions/
```

**Edge:**
```
edge://extensions/
```

Or click the menu → More tools → Extensions

---

### Step 2: Enable Developer Mode

Toggle the **Developer mode** switch in the top-right corner

![Developer Mode Toggle](https://user-images.githubusercontent.com/placeholder/developer-mode.png)

---

### Step 3: Load Unpacked Extension

1. Click **"Load unpacked"** button
2. Navigate to this folder: `veo-automation-extension`
3. Click **"Select Folder"**

---

### Step 4: Verify Installation

You should see:

```
✅ VEO Automation - Google Flow AI VEO Automation
   Version: 2.1.3.0
   ID: [your-extension-id]
```

---

### Step 5: Pin Extension (Optional)

1. Click the puzzle piece icon (Extensions) in Chrome toolbar
2. Find "VEO Automation"
3. Click the pin icon to keep it visible

---

## Usage

### 1. Navigate to Google Flow

Go to: https://labs.google/fx/tools/flow

### 2. Open Side Panel

- Click the extension icon in toolbar, OR
- Side panel opens automatically

### 3. Start Automating

- Add prompts in the side panel
- Set project name (optional)
- Click "Start" to begin batch processing
- Generated videos/images download automatically

---

## Troubleshooting

### Extension Not Loading?

**Error: "Manifest file is missing or unreadable"**
- Make sure you selected the `veo-automation-extension` folder (not the parent `extension` folder)

**Error: "Failed to load extension"**
- Check that `manifest.json` exists in the selected folder
- Verify Developer mode is enabled

### Side Panel Not Opening?

1. Go to `chrome://extensions/`
2. Click **"Inspect views: service worker"** under VEO Automation
3. Check console for errors
4. Try reloading the extension (click reload icon)

### Downloads Not Working?

1. Check Chrome's download settings
2. Verify extension has `downloads` permission in `manifest.json`
3. Check if Chrome blocked the download (look for download icon in address bar)

---

## Uninstall

1. Go to `chrome://extensions/`
2. Find "VEO Automation"
3. Click **"Remove"**
4. Confirm deletion

---

## Update Extension

After modifying files:

1. Go to `chrome://extensions/`
2. Find "VEO Automation"
3. Click the **reload icon** (circular arrow)
4. Extension will reload with your changes

---

## Next Steps

- Read [README.md](README.md) for full documentation
- Check permissions in `manifest.json`
- Customize extension name/icon if needed

---

**Need Help?** Contact: kylenguyenaws@gmail.com
