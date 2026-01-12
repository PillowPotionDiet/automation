# PillowPotion Extension - Troubleshooting Guide

## 🔧 Common Errors and Fixes

---

## Error: CSP Violations (frame-ancestors)

### What You See:
```
Framing 'https://ogs.google.com/' violates the following report-only
Content Security Policy directive: "frame-ancestors 'self'"
```

### Explanation:
This is a **harmless warning** from Google services trying to load in frames. It won't affect your extension functionality.

### Fix:
✅ **Already fixed** in manifest.json with CSP policy. You can safely ignore these warnings.

---

## Error: Failed to load resource (CSP)

### What You See:
```
Failed to load resource: csp.withgoogle.com/c_36baac3725d1408f8:1
net::ERR_FAILED
```

### Explanation:
Google's own CSP reporting endpoint. This is normal and doesn't affect the extension.

### Fix:
✅ **No action needed** - This is expected behavior from Google's infrastructure.

---

## Error: ERR_FILE_NOT_FOUND

### What You See:
```
Your file couldn't be accessed
It may have been moved, edited, or deleted.
ERR_FILE_NOT_FOUND
```

### Possible Causes:
1. Extension not loaded properly
2. File path is incorrect
3. Extension needs to be reloaded

### Fix:

#### Step 1: Reload the Extension
```
1. Go to chrome://extensions/
2. Find "PillowPotion - AI Video Automation"
3. Click the reload icon (circular arrow)
4. Try opening the extension again
```

#### Step 2: Check File Structure
Make sure these files exist:
```
extension/pillowpotion-extension/
├── src/
│   ├── auth/
│   │   ├── login.html ✅
│   │   ├── login.js ✅
│   │   └── auth-wrapper.js ✅
│   ├── assets/
│   │   └── logo.png ✅
│   ├── styles/
│   │   └── auth.css ✅
│   └── ui/side-panel/
│       └── index.html ✅
└── manifest.json ✅
```

#### Step 3: Clear Extension Data
```
1. Chrome DevTools (F12)
2. Application tab
3. Storage → Clear site data
4. Reload extension
```

---

## Error: Module not found (auth.js or credits.js)

### What You See:
```
Failed to load module script: Expected a JavaScript module script
```

### Fix:

Check import paths in files:
```javascript
// auth-wrapper.js should have:
import authService from '../services/auth.js';
import creditsService from '../services/credits.js';

// login.js should have:
import authService from '../services/auth.js';
```

Make sure the files exist at the correct paths.

---

## Error: Network Error on Login

### What You See:
```
POST https://automation.pillowpotion.com/public/api/auth/login.php
net::ERR_FAILED
```

### Causes:
1. Backend API is not accessible
2. CORS not configured
3. Wrong API URL

### Fix:

#### Option 1: Check Backend is Running
```bash
# Try accessing directly:
https://automation.pillowpotion.com/public/api/auth/check.php

# Should return JSON response
```

#### Option 2: Enable CORS on Backend

Add to all PHP API files (`public/api/auth/*.php`):

```php
<?php
// At the very top of each file, before any other code:

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ... rest of your code
```

#### Option 3: Use Local Backend for Testing

Edit `src/services/auth.js`:
```javascript
// Line 11 - Change to local:
this.API_BASE = 'http://localhost/script-to-video-generator/public';
```

Then reload extension.

---

## Error: 401 Unauthorized

### What You See:
```
POST .../api/auth/login.php 401 (Unauthorized)
```

### Causes:
1. Invalid email/password
2. User not verified
3. Account doesn't exist

### Fix:
1. Check credentials are correct
2. Verify email is verified in database
3. Try creating new account via web tool

---

## Error: Credits not updating / Failed to fetch credits

### What You See:
- Credits stuck at 0 or not changing
- Console error: "Failed to fetch credits"
- Network errors when calling credits API

### Possible Causes:
1. CORS not enabled on backend
2. Credits API endpoint not accessible
3. Auth token expired
4. Network connectivity issue

### Fix:

#### Step 1: Check Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors like:
   - "Failed to fetch credits"
   - "Get credits error"
   - "Network error"
   - 401/403 responses
```

#### Step 2: Verify API is Accessible
```
1. Open Network tab in DevTools
2. Reload extension
3. Look for request to: /api/user/credits.php
4. Check response status:
   - 200: OK
   - 401: Token expired (logout and login again)
   - 403: Permission denied
   - 404: API endpoint missing
   - 500: Server error
```

#### Step 3: Check CORS Headers
The backend must return these headers:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
```

Verify in `public/api/user/credits.php` that CORS headers are set.

#### Step 4: Verify Token
```javascript
// In console, run:
chrome.storage.local.get(['auth_token', 'user'], (data) => {
  console.log('Token:', data.auth_token);
  console.log('User:', data.user);
  console.log('Credits:', data.user?.credits);
});
```

#### Step 5: Test API Directly
```
1. Get your token from Step 4
2. Open new tab and navigate to:
   https://automation.pillowpotion.com/public/api/user/credits.php
3. Open DevTools → Console
4. Run:
   fetch('https://automation.pillowpotion.com/public/api/user/credits.php', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' }
   }).then(r => r.json()).then(console.log)
```

#### Step 6: Fallback to Cached Credits
The extension automatically falls back to cached credits if the API fails. This means:
- Credits will show the last known value
- They won't update in real-time until API is fixed
- You can still use the extension with cached data

---

## Error: Extension appears blank/white screen

### Causes:
1. JavaScript error preventing render
2. CSS not loading
3. Module import error

### Fix:

#### Step 1: Check Console Errors
```
F12 → Console
Look for red errors
```

#### Step 2: Verify Files Loaded
```
F12 → Network tab
Reload extension
Check all files load (200 status)
```

#### Step 3: Hard Refresh
```
1. Go to chrome://extensions/
2. Remove extension
3. Close Chrome completely
4. Reopen Chrome
5. Load extension again
```

---

## Error: Google Fonts not loading

### What You See:
Fonts look different, default system font

### Fix:

Already fixed in manifest.json with CSP:
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self'; font-src 'self' https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
}
```

If still not working:
1. Check internet connection
2. Reload extension
3. Clear browser cache

---

## How to Debug

### General Debugging Steps:

#### 1. Open DevTools
```
Right-click in extension → Inspect
OR
F12 when extension is focused
```

#### 2. Check Console Tab
```
Look for:
- Red errors
- Failed network requests
- JavaScript exceptions
```

#### 3. Check Network Tab
```
Filter by:
- XHR (API calls)
- Failed (red status)
Look at response bodies
```

#### 4. Check Storage
```
Application → Storage → Local Storage
Should see:
- auth_token (JWT string)
- user (JSON object with email, credits, etc.)
```

#### 5. Check Files Loaded
```
Sources → Page
Verify all .js and .css files are present
```

---

## Quick Fixes Checklist

When extension doesn't work:

- [ ] Reload extension (chrome://extensions/ → reload icon)
- [ ] Check console for errors (F12)
- [ ] Verify backend is accessible
- [ ] Check CORS headers in PHP
- [ ] Clear extension storage
- [ ] Try different browser/profile
- [ ] Check manifest.json syntax
- [ ] Verify all files exist
- [ ] Check file paths are correct
- [ ] Test with local backend

---

## Still Having Issues?

### 1. Collect Debug Info
```javascript
// Run in console:
console.log('Extension loaded:', !!window);
console.log('Auth service:', typeof authService);

chrome.storage.local.get(null, (data) => {
  console.log('Storage:', data);
});
```

### 2. Check Browser Compatibility
- Chrome version 88+ required for Manifest V3
- Edge version 88+ required

### 3. Check File Permissions
Make sure files are readable:
```bash
# Windows:
icacls "extension/pillowpotion-extension" /grant Everyone:R

# Unix:
chmod -R 755 extension/pillowpotion-extension
```

---

## Known Limitations

1. **Google CSP Warnings**: Will always appear, can be ignored
2. **Local Storage Only**: No cloud sync (by design)
3. **Single Account**: Can't switch accounts without logout
4. **30s Poll Interval**: Credits update every 30 seconds (configurable)

---

## Contact/Support

If none of these fixes work:

1. Check full docs: `AUTHENTICATION_IMPLEMENTATION.md`
2. Review implementation plan: `EXTENSION_AUTH_IMPLEMENTATION_PLAN.md`
3. Check quick start: `QUICK_START.md`

### Debug Data to Collect:
- Browser version
- Extension version (3.1.0)
- Console errors (screenshot)
- Network tab (failed requests)
- Storage contents (chrome.storage.local)

---

**Last Updated:** 2026-01-02
**Extension Version:** 3.1.0
