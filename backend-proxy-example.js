/**
 * Backend Proxy for GeminiGen.AI API
 *
 * This proxy server forwards requests from your frontend to GeminiGen.AI API
 * to avoid CORS issues. Deploy this on your backend server.
 *
 * Requirements:
 * - Node.js 14+
 * - npm install express cors multer node-fetch
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');

const app = express();
const upload = multer();

// Enable CORS for your frontend domain
app.use(cors({
    origin: 'https://automation.pillowpotion.com', // Your frontend domain
    credentials: true
}));

app.use(express.json());

// GeminiGen.AI API configuration
const GEMINIGEN_BASE_URL = 'https://api.geminigen.ai';

/**
 * Proxy endpoint for image generation
 * POST /api/geminigen/generate-image
 */
app.post('/api/geminigen/generate-image', upload.none(), async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                error: 'MISSING_API_KEY',
                message: 'API key is required'
            });
        }

        // Build FormData for GeminiGen.AI
        const FormData = require('form-data');
        const formData = new FormData();

        formData.append('prompt', req.body.prompt);
        formData.append('model', req.body.model || 'imagen-pro');
        formData.append('aspect_ratio', req.body.aspect_ratio || '16:9');
        formData.append('style', req.body.style || 'Photorealistic');

        if (req.body.ref_history) {
            formData.append('ref_history', req.body.ref_history);
        }

        // Forward request to GeminiGen.AI
        const response = await fetch(`${GEMINIGEN_BASE_URL}/uapi/v1/generate_image`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                ...formData.getHeaders()
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error('Image generation proxy error:', error);
        res.status(500).json({
            error: 'PROXY_ERROR',
            message: error.message
        });
    }
});

/**
 * Proxy endpoint for video generation
 * POST /api/geminigen/generate-video
 */
app.post('/api/geminigen/generate-video', upload.none(), async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                error: 'MISSING_API_KEY',
                message: 'API key is required'
            });
        }

        // Build FormData for GeminiGen.AI
        const FormData = require('form-data');
        const formData = new FormData();

        formData.append('prompt', req.body.prompt);
        formData.append('model', req.body.model || 'veo-3.1');
        formData.append('resolution', req.body.resolution || '1080p');
        formData.append('aspect_ratio', req.body.aspect_ratio || '16:9');

        if (req.body.file_urls) {
            formData.append('file_urls', req.body.file_urls);
        }

        if (req.body.ref_history) {
            formData.append('ref_history', req.body.ref_history);
        }

        // Forward request to GeminiGen.AI
        const response = await fetch(`${GEMINIGEN_BASE_URL}/uapi/v1/video-gen/veo`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                ...formData.getHeaders()
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error('Video generation proxy error:', error);
        res.status(500).json({
            error: 'PROXY_ERROR',
            message: error.message
        });
    }
});

/**
 * Proxy endpoint for status checking
 * GET /api/geminigen/status/:uuid
 */
app.get('/api/geminigen/status/:uuid', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const { uuid } = req.params;

        if (!apiKey) {
            return res.status(401).json({
                error: 'MISSING_API_KEY',
                message: 'API key is required'
            });
        }

        // Forward request to GeminiGen.AI
        const response = await fetch(`${GEMINIGEN_BASE_URL}/uapi/v1/status/${uuid}`, {
            method: 'GET',
            headers: {
                'x-api-key': apiKey
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.json(data);

    } catch (error) {
        console.error('Status check proxy error:', error);
        res.status(500).json({
            error: 'PROXY_ERROR',
            message: error.message
        });
    }
});

/**
 * Test connection endpoint
 * GET /api/geminigen/test
 */
app.get('/api/geminigen/test', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: 'MISSING_API_KEY',
                message: 'API key is required'
            });
        }

        // Simple test request
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('prompt', 'a simple test image');
        formData.append('model', 'imagen-pro');
        formData.append('aspect_ratio', '1:1');
        formData.append('style', 'None');

        const response = await fetch(`${GEMINIGEN_BASE_URL}/uapi/v1/generate_image`, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                ...formData.getHeaders()
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            res.json({
                success: true,
                message: 'API connection successful!',
                data: data
            });
        } else {
            const errorMsg = data?.detail?.message || data?.message || `HTTP ${response.status}`;
            res.status(response.status).json({
                success: false,
                message: `Connection failed: ${errorMsg}`,
                error: data?.detail?.error_code || 'UNKNOWN_ERROR',
                statusCode: response.status
            });
        }

    } catch (error) {
        console.error('Connection test proxy error:', error);
        res.status(500).json({
            success: false,
            error: 'PROXY_ERROR',
            message: `Network error: ${error.message}`
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`GeminiGen.AI Proxy Server running on port ${PORT}`);
    console.log(`Endpoints:`);
    console.log(`  POST   /api/geminigen/generate-image`);
    console.log(`  POST   /api/geminigen/generate-video`);
    console.log(`  GET    /api/geminigen/status/:uuid`);
    console.log(`  GET    /api/geminigen/test`);
});

module.exports = app;
