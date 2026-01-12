# VEO Automation Extension 2.0 - Quick Start

## 🚀 Installation (2 Minutes)

1. **Load Extension**
   ```
   Chrome → chrome://extensions/
   → Enable "Developer mode" (top right)
   → Click "Load unpacked"
   → Select this folder
   ```

2. **Verify Installation**
   - Extension appears in list
   - Status: Enabled ✅
   - Version: 2.1.6

3. **Open YouTube Story Generator**
   - Production: https://automation.pillowpotion.com/tools/youtube-story-generator/
   - Local: http://localhost:5500/public/tools/youtube-story-generator/

4. **Check Console (F12)**
   ```
   Should see:
   [VEO Bridge] Bridge initialized ✅
   [VEO Background] Handler ready ✅
   ```

---

## 🎬 Usage (3 Clicks)

1. **Enter your script** in YouTube Story Generator
2. **Select "Storyboard Brain"** (recommended)
3. **Click "Generate Identities"**

**That's it!** Everything else is automatic! ✨

---

## 📊 What Happens Automatically

```
5%   → Checking extension...
10%  → Preparing data...
15%  → Sending to extension...
20%  → Opening Google Labs Flow...
40%  → Populating prompts...
50%  → Configuring settings...
60%  → Starting generation...
70%  → Generating images...
90%  → Collecting results...
100% → Done! → Navigate to Page 2 ✅
```

---

## 🐛 Troubleshooting

**Extension not detected?**
- Reload extension in chrome://extensions/
- Refresh YouTube Story Generator page

**Automation stalls?**
- Check Google Labs Flow tab opened
- Verify Google account logged in
- Check browser console for errors

**No images?**
- Check Downloads folder
- Verify "downloads" permission enabled
- Check browser allows downloads

---

## 📁 Key Files

- `content-script-bridge.js` - Web page ↔ Extension communication
- `background-automation-handler.js` - Automation logic
- `manifest.json` - Extension configuration

---

## ✅ Success Indicators

✅ Console shows bridge messages
✅ Progress bar updates smoothly
✅ Google Labs Flow opens automatically
✅ Extension side panel opens
✅ Prompts populate automatically
✅ Images download to folder
✅ Page navigates to Page 2

---

## 📖 Full Documentation

See: `FULL_AUTOMATION_SETUP_GUIDE.md` in project root

---

**Ready to automate? Just load the extension and go!** 🎉
