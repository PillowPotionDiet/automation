# Deployment Instructions

## Problem

Your frontend shows **CORS errors** because GeminiGen.AI API blocks direct browser requests from `https://automation.pillowpotion.com`.

## Solution

Deploy a **backend proxy** on your server that forwards requests from your frontend to GeminiGen.AI API.

---

## Step 1: Deploy Backend Proxy

On your server at `automation.pillowpotion.com`:

```bash
cd /path/to/your/backend
git pull origin main

# Install dependencies
npm install

# Start the proxy server
npm start
# OR with PM2 for production:
pm2 start backend-proxy-example.js --name geminigen-proxy
```

The proxy will create these endpoints on your server:

- `POST https://automation.pillowpotion.com/api/geminigen/generate-image`
- `POST https://automation.pillowpotion.com/api/geminigen/generate-video`
- `GET https://automation.pillowpotion.com/api/geminigen/status/:uuid`
- `GET https://automation.pillowpotion.com/api/geminigen/test`

---

## Step 2: Update Frontend

```bash
# Pull latest frontend changes
git pull origin main
```

The frontend is already configured to use your proxy automatically!

---

## Step 3: Test

1. Open `https://automation.pillowpotion.com/`
2. Enter your GeminiGen.AI API key
3. Click **"Test Connection"**
4. Should show: ✅ "API connection successful!"

---

## Alternative: Integrate into Existing Backend

If you already have a Node.js/Express backend running:

1. Copy the proxy endpoints from [backend-proxy-example.js](backend-proxy-example.js)
2. Add them to your existing Express app
3. Ensure CORS is configured for your frontend domain:

```javascript
app.use(cors({
    origin: 'https://automation.pillowpotion.com',
    credentials: true
}));
```

---

## Troubleshooting

See [PROXY_SETUP.md](PROXY_SETUP.md) for detailed troubleshooting steps.

### Quick Fixes:

**"Network error: Failed to fetch"**
- Backend proxy not running → Start it with `npm start`

**"404 Not Found" for /api/geminigen/*
- Proxy endpoints not set up → Deploy backend-proxy-example.js

**Still getting CORS errors**
- CORS origin mismatch → Check CORS config in proxy

---

## Files Reference

- **[backend-proxy-example.js](backend-proxy-example.js)** - Complete proxy server code
- **[package.json](package.json)** - Dependencies for proxy
- **[PROXY_SETUP.md](PROXY_SETUP.md)** - Detailed setup guide
- **[api-client.js](api-client.js)** - Frontend API client (already configured)

---

## Architecture

```
Frontend (Browser)
    ↓
Your Backend Proxy (automation.pillowpotion.com/api/geminigen/*)
    ↓
GeminiGen.AI API (api.geminigen.ai/uapi/v1/*)
```

This avoids CORS by making backend-to-backend requests instead of browser-to-API requests.
