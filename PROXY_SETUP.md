# Backend Proxy Setup Guide

## Why You Need a Proxy

GeminiGen.AI API blocks direct browser requests due to CORS (Cross-Origin Resource Sharing) restrictions. A backend proxy allows your frontend to communicate with the API through your server.

## Quick Setup

### 1. Install Dependencies

```bash
npm install express cors multer node-fetch form-data
```

### 2. Deploy Proxy Server

Copy the [backend-proxy-example.js](backend-proxy-example.js) file to your backend server and run it:

```bash
node backend-proxy-example.js
```

By default, it runs on port 3000. You can change this with the `PORT` environment variable:

```bash
PORT=8080 node backend-proxy-example.js
```

### 3. Configure Your Hosting

Deploy the proxy to your hosting platform. For example:

**For Node.js hosting (Heroku, Railway, Render, etc.):**
- Upload `backend-proxy-example.js`
- Add `package.json` with dependencies
- Deploy and note your proxy URL

**For existing Express app:**
- Copy the proxy endpoints from `backend-proxy-example.js`
- Add them to your existing Express routes
- Ensure CORS is configured for your frontend domain

### 4. Update Frontend (Already Done!)

The frontend [api-client.js](api-client.js) is already configured to use proxy mode by default. It will automatically use your backend proxy at:

```
https://automation.pillowpotion.com/api/geminigen/*
```

## Proxy Endpoints

Your backend needs these endpoints:

- `POST /api/geminigen/generate-image` - Generate images
- `POST /api/geminigen/generate-video` - Generate videos
- `GET /api/geminigen/status/:uuid` - Check generation status
- `GET /api/geminigen/test` - Test API connection

## Testing

Once deployed, test the connection:

1. Open your frontend: `https://automation.pillowpotion.com/`
2. Enter your GeminiGen.AI API key
3. Click "Test Connection"
4. You should see "API connection successful!"

## Troubleshooting

### "Network error: Failed to fetch"

**Problem**: Frontend can't reach your backend proxy

**Solutions**:
- Verify your backend proxy is running
- Check the proxy URL in browser DevTools → Network tab
- Ensure firewall allows connections to proxy server

### "404 Not Found" for proxy endpoints

**Problem**: Proxy endpoints not set up correctly

**Solutions**:
- Verify all 4 endpoints are implemented
- Check endpoint paths match exactly:
  - `/api/geminigen/generate-image` (not `/generate_image`)
  - `/api/geminigen/generate-video` (not `/video-gen/veo`)
  - `/api/geminigen/status/:uuid`
  - `/api/geminigen/test`

### "CORS error" from your own domain

**Problem**: Your proxy doesn't allow requests from your frontend

**Solution**: In `backend-proxy-example.js`, verify the CORS origin:

```javascript
app.use(cors({
    origin: 'https://automation.pillowpotion.com', // Your frontend domain
    credentials: true
}));
```

### API key errors

**Problem**: API key not being forwarded correctly

**Solution**: Verify the proxy forwards the `x-api-key` header to GeminiGen.AI:

```javascript
headers: {
    'x-api-key': apiKey,  // Forward from request
    ...
}
```

## Alternative: Direct API Mode

If you want to bypass the proxy (not recommended due to CORS), you can disable proxy mode:

In [app.js](app.js), change line 217:

```javascript
// From:
AppState.api = new GeminiGenAPI(AppState.apiKey);

// To:
AppState.api = new GeminiGenAPI(AppState.apiKey, { useProxy: false });
```

**Note**: This will only work if:
1. GeminiGen.AI adds your domain to their CORS whitelist, OR
2. You use a CORS proxy browser extension (not recommended for production)

## Security Notes

- **Never commit API keys** to your repository
- **Use environment variables** for sensitive data
- **Validate API keys** on the backend before forwarding requests
- **Rate limit** your proxy endpoints to prevent abuse
- **Log requests** for debugging but never log API keys

## Need Help?

- Check backend logs for detailed error messages
- Use browser DevTools → Network tab to see exact requests
- Verify GeminiGen.AI API is working directly: https://api.geminigen.ai/

## Example `package.json`

```json
{
  "name": "geminigen-proxy",
  "version": "1.0.0",
  "description": "Backend proxy for GeminiGen.AI API",
  "main": "backend-proxy-example.js",
  "scripts": {
    "start": "node backend-proxy-example.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "form-data": "^4.0.0",
    "multer": "^1.4.5-lts.1",
    "node-fetch": "^2.7.0"
  }
}
```

Save this as `package.json` in the same directory as `backend-proxy-example.js`, then run:

```bash
npm install
npm start
```
