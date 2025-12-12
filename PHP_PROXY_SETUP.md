# PHP Proxy Setup (Easiest Method!)

## Why This Method?

✅ **No Node.js required** - Works with standard PHP hosting
✅ **No npm install** - No dependencies needed
✅ **Quick deployment** - Just 2 files
✅ **Works immediately** - No server restart needed

---

## Setup (2 Minutes)

### Step 1: Upload Files

Upload these 2 files to your web root (`public_html` or `www`):

1. **[proxy.php](proxy.php)** - The proxy script
2. **`.htaccess`** - URL rewriting (rename `.htaccess-example` to `.htaccess`)

### Step 2: Test

Open your browser and go to:
```
https://automation.pillowpotion.com/
```

1. Enter your GeminiGen.AI API key
2. Click "Test Connection"
3. Should see: ✅ "API connection successful!"

---

## File Structure

```
automation.pillowpotion.com/
├── index.html          (your frontend)
├── app.js              (your frontend JS)
├── api-client.js       (your frontend JS)
├── proxy.php           (NEW - handles API requests)
└── .htaccess           (NEW - routes /api/geminigen/* to proxy.php)
```

---

## How It Works

```
Browser → /api/geminigen/test
    ↓
.htaccess (routes to proxy.php)
    ↓
proxy.php (forwards to GeminiGen.AI)
    ↓
api.geminigen.ai
```

---

## Troubleshooting

### "404 Not Found" for /api/geminigen/test

**Problem**: `.htaccess` not working

**Solutions**:
1. Verify `.htaccess` is in the same directory as `index.html`
2. Check Apache has `mod_rewrite` enabled:
   ```bash
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```
3. Verify `AllowOverride All` in Apache config

### "500 Internal Server Error"

**Problem**: PHP or cURL issue

**Solutions**:
1. Check PHP error logs: `/var/log/apache2/error.log`
2. Verify PHP cURL is installed:
   ```bash
   sudo apt-get install php-curl
   sudo systemctl restart apache2
   ```

### "Network error" in browser

**Problem**: CORS misconfiguration

**Solution**: In [proxy.php](proxy.php:9), verify:
```php
header('Access-Control-Allow-Origin: https://automation.pillowpotion.com');
```

---

## For Nginx Users

If you're using Nginx instead of Apache, add this to your `nginx.conf`:

```nginx
location /api/geminigen/ {
    rewrite ^/api/geminigen/(.*)$ /proxy.php last;
}
```

---

## Testing Manually

Test the proxy directly:

```bash
curl -X GET https://automation.pillowpotion.com/api/geminigen/test \
  -H "x-api-key: YOUR_API_KEY"
```

Should return JSON:
```json
{
  "success": true,
  "message": "API connection successful!"
}
```

---

## Security Notes

- API keys are forwarded securely (never stored)
- CORS restricted to your domain only
- Requests timeout after 60 seconds
- No file uploads allowed (only JSON data)

---

## Alternative: Node.js Proxy

If you prefer Node.js (requires more setup):
- See [backend-proxy-example.js](backend-proxy-example.js)
- See [PROXY_SETUP.md](PROXY_SETUP.md)

---

## Need Help?

1. Check PHP error logs: `/var/log/apache2/error.log` or `/var/log/php/error.log`
2. Check Apache error logs: `/var/log/apache2/error.log`
3. Test proxy directly with curl (see above)
4. Verify `.htaccess` is loading: Add this to test:
   ```apache
   # Test comment
   ```
   Then check if you get 500 error (means it's loading)
