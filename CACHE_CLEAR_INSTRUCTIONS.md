# Complete Cache Clearing Instructions

## For Chrome/Edge:
1. Open DevTools (F12)
2. Right-click on the Refresh button (while DevTools is open)
3. Select **"Empty Cache and Hard Reload"**
4. Wait for page to fully reload

## For Firefox:
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "Cached Web Content"
3. Time range: "Everything"
4. Click "Clear Now"
5. Press `Ctrl+F5` to hard refresh

## For Safari:
1. Press `Cmd+Option+E` to empty caches
2. Press `Cmd+R` to reload

## If still not working:
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Right-click on your domain under "Local Storage"
4. Select "Clear"
5. Right-click on your domain under "Session Storage"
6. Select "Clear"
7. Go to **Network** tab
8. Check **"Disable cache"** checkbox
9. Reload the page with `Ctrl+Shift+R`

## Nuclear Option - Clear Everything:
1. Press `Ctrl+Shift+Delete`
2. Select ALL options:
   - Browsing history
   - Download history
   - Cookies and other site data
   - **Cached images and files**
3. Time range: **All time**
4. Click Clear data
5. Close browser completely
6. Reopen browser
7. Visit site with `Ctrl+Shift+R`

## Verify Cache is Cleared:
Open DevTools → Network tab → reload page.
Look at app.js - it should show:
- Status: 200
- Size: Should show actual file size (not "disk cache" or "memory cache")
- Check the Response preview - line 64 should show `// Load saved API key`
