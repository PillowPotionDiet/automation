/**
 * GEMINIGEN API CLIENT
 * Flexible API client for GeminiGen.ai with endpoint discovery
 */

class GeminiGenAPI {
    constructor(apiKey, options = {}) {
        this.apiKey = apiKey;

        // Use proxy mode to avoid CORS issues
        this.useProxy = options.useProxy !== undefined ? options.useProxy : true;
        this.proxyBaseURL = options.proxyBaseURL || window.location.origin;
        this.baseURL = 'https://api.geminigen.ai'; // Direct API URL (not used in proxy mode)

        // Alternative base URLs to try (direct mode only)
        this.baseURLs = [
            'https://api.geminigen.ai',
            'https://geminigen.ai/api',
            'https://api.geminigen.com'
        ];

        // Proxy endpoints (when useProxy = true)
        this.proxyEndpoints = {
            imageGenerate: '/api/geminigen/generate-image',
            videoGenerate: '/api/geminigen/generate-video',
            jobStatus: '/api/geminigen/status',
            test: '/api/geminigen/test'
        };

        // Direct GeminiGen.AI endpoints (when useProxy = false)
        this.directEndpoints = {
            imageGenerate: '/uapi/v1/generate_image',
            videoGenerate: '/uapi/v1/video-gen/veo',
            jobStatus: '/uapi/v1/status'
        };

        // Use proxy endpoints by default
        this.endpoints = this.useProxy ? this.proxyEndpoints : this.directEndpoints;

        // Available models
        this.models = {
            image: {
                'imagen-pro': 'imagen-pro',  // Gemini 3.0 Image (Nano Banana Pro) - Default, Free
                'imagen-flash': 'imagen-flash',  // Gemini 2.5 Flash
                'imagen-4-fast': 'imagen-4-fast',  // Imagen 4 Fast
                'imagen-4': 'imagen-4',  // Imagen 4
                'imagen-4-ultra': 'imagen-4-ultra'  // Imagen 4 Ultra
            },
            video: {
                'veo-3': 'veo-3',  // High-quality
                'veo-3-fast': 'veo-3-fast',  // Fast version
                'veo-3.1': 'veo-3.1',  // Latest high-quality (Default)
                'veo-3.1-fast': 'veo-3.1-fast',  // Fast version of 3.1
                'veo-2': 'veo-2'  // Advanced with flexible duration
            }
        };

        // Default settings
        this.defaultImageModel = 'imagen-pro';
        this.defaultVideoModel = 'veo-3.1';
        this.defaultAspectRatio = '16:9';
        this.defaultVideoResolution = '1080p';
        this.defaultStyle = 'Photorealistic';
    }

    /**
     * Test API connection
     * @returns {Promise<Object>} { success: boolean, message: string, error: string }
     */
    async testConnection() {
        try {
            if (this.useProxy) {
                // Use proxy test endpoint
                const response = await fetch(this.proxyBaseURL + this.proxyEndpoints.test, {
                    method: 'GET',
                    headers: {
                        'x-api-key': this.apiKey
                    }
                });

                return await response.json();

            } else {
                // Direct API test - generate a minimal test image
                const formData = new FormData();
                formData.append('prompt', 'a simple test image');
                formData.append('model', this.defaultImageModel);
                formData.append('aspect_ratio', '1:1');
                formData.append('style', 'None');

                const response = await fetch(this.baseURL + this.endpoints.imageGenerate, {
                    method: 'POST',
                    headers: {
                        'x-api-key': this.apiKey
                    },
                    body: formData
                });

                // Parse response
                const data = await response.json().catch(() => null);

                if (response.ok) {
                    return {
                        success: true,
                        message: 'API connection successful!',
                        data: data
                    };
                } else {
                    const errorMsg = data?.detail?.message || data?.message || `HTTP ${response.status}: ${response.statusText}`;
                    const errorCode = data?.detail?.error_code || 'UNKNOWN_ERROR';

                    return {
                        success: false,
                        message: `Connection failed: ${errorMsg}`,
                        error: errorCode,
                        statusCode: response.status
                    };
                }
            }
        } catch (error) {
            console.error('Connection test failed:', error);
            return {
                success: false,
                message: `Network error: ${error.message}`,
                error: 'NETWORK_ERROR'
            };
        }
    }

    /**
     * Try multiple endpoints until one works
     * @param {string[]} endpointList - List of endpoint patterns
     * @param {string} method - HTTP method
     * @param {Object} body - Request body
     * @returns {Promise<Object>} Response data
     */
    async makeRequest(endpointList, method, body = null) {
        const errors = [];

        // Try cached successful endpoint first
        const cacheKey = JSON.stringify({ endpointList, method });
        if (this.successfulEndpoints[cacheKey]) {
            try {
                const response = await this.fetchEndpoint(
                    this.baseURL + this.successfulEndpoints[cacheKey],
                    method,
                    body
                );
                if (response.ok) {
                    return await response.json();
                }
            } catch (err) {
                // Cache is stale, continue to try all endpoints
                delete this.successfulEndpoints[cacheKey];
            }
        }

        // Try all endpoint patterns
        for (const endpoint of endpointList) {
            try {
                const response = await this.fetchEndpoint(
                    this.baseURL + endpoint,
                    method,
                    body
                );

                if (response.ok) {
                    // Cache successful endpoint
                    this.successfulEndpoints[cacheKey] = endpoint;
                    return await response.json();
                }

                errors.push({
                    endpoint,
                    status: response.status,
                    statusText: response.statusText
                });
            } catch (err) {
                errors.push({
                    endpoint,
                    error: err.message
                });
            }
        }

        // All endpoints failed
        console.error('All endpoints failed:', errors);
        throw new Error(`API request failed. Tried ${endpointList.length} endpoints.`);
    }

    /**
     * Fetch a specific endpoint
     * @param {string} url - Full URL
     * @param {string} method - HTTP method
     * @param {Object} body - Request body
     * @returns {Promise<Response>} Fetch response
     */
    async fetchEndpoint(url, method, body) {
        const options = {
            method: method,
            headers: {
                'x-api-key': this.apiKey,  // GeminiGen.AI uses x-api-key header
                'Content-Type': 'application/json'
            }
        };

        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        return await fetch(url, options);
    }

    /**
     * Generate an image using GeminiGen.AI API
     * @param {string} prompt - Image prompt
     * @param {Object} options - Additional options (model, aspect_ratio, style, etc.)
     * @returns {Promise<string>} Image URL
     */
    async generateImage(prompt, options = {}) {
        try {
            if (this.useProxy) {
                // Use proxy endpoint - send as JSON
                const body = {
                    prompt: prompt,
                    model: options.model || this.defaultImageModel,
                    aspect_ratio: options.aspect_ratio || this.defaultAspectRatio,
                    style: options.style || this.defaultStyle
                };

                if (options.ref_history) {
                    body.ref_history = options.ref_history;
                }

                const response = await fetch(this.proxyBaseURL + this.proxyEndpoints.imageGenerate, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || errorData.detail?.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                // Check status
                if (data.status === 3) {
                    throw new Error(data.error_message || 'Image generation failed');
                }

                // Extract image URL
                const imageUrl = data.generate_result;
                if (!imageUrl) {
                    throw new Error('No image URL in response');
                }

                return imageUrl;

            } else {
                // Direct API call - use FormData
                const formData = new FormData();
                formData.append('prompt', prompt);
                formData.append('model', options.model || this.defaultImageModel);
                formData.append('aspect_ratio', options.aspect_ratio || this.defaultAspectRatio);
                formData.append('style', options.style || this.defaultStyle);

                if (options.ref_history) {
                    formData.append('ref_history', options.ref_history);
                }

                const response = await fetch(this.baseURL + this.endpoints.imageGenerate, {
                    method: 'POST',
                    headers: {
                        'x-api-key': this.apiKey
                    },
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail?.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();

                // Check status
                if (data.status === 3) {
                    throw new Error(data.error_message || 'Image generation failed');
                }

                // Extract image URL
                const imageUrl = data.generate_result;
                if (!imageUrl) {
                    throw new Error('No image URL in response');
                }

                return imageUrl;
            }

        } catch (error) {
            console.error('Image generation error:', error);
            throw error;
        }
    }

    /**
     * Extract image URL from response
     * @param {Object} data - API response
     * @returns {string|null} Image URL
     */
    extractImageURL(data) {
        // Try various possible field names
        return data.image_url ||
               data.imageUrl ||
               data.url ||
               data.data?.url ||
               data.images?.[0]?.url ||
               data.images?.[0] ||
               data.image ||
               data.data?.[0]?.url ||
               null;
    }

    /**
     * Extract video URL from response
     * @param {Object} data - API response
     * @returns {string|null} Video URL
     */
    extractVideoURL(data) {
        // Try various possible field names
        return data.video_url ||
               data.videoUrl ||
               data.url ||
               data.data?.url ||
               data.videos?.[0]?.url ||
               data.videos?.[0] ||
               data.video ||
               data.data?.[0]?.url ||
               null;
    }

    /**
     * Generate a video using GeminiGen.AI Veo API
     * @param {string} prompt - Video description
     * @param {Object} options - Additional options (model, resolution, aspect_ratio, file_urls, etc.)
     * @param {Function} progressCallback - Optional callback for progress updates (progress, status)
     * @returns {Promise<string>} Video URL
     */
    async generateVideo(prompt, options = {}, progressCallback = null) {
        try {
            let response;

            if (this.useProxy) {
                // Use proxy endpoint - send as JSON
                const body = {
                    prompt: prompt,
                    model: options.model || this.defaultVideoModel,
                    resolution: options.resolution || this.defaultVideoResolution,
                    aspect_ratio: options.aspect_ratio || this.defaultAspectRatio
                };

                if (options.file_urls) {
                    body.file_urls = options.file_urls;
                }

                if (options.ref_history) {
                    body.ref_history = options.ref_history;
                }

                response = await fetch(this.proxyBaseURL + this.proxyEndpoints.videoGenerate, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey
                    },
                    body: JSON.stringify(body)
                });

            } else {
                // Direct API call - use FormData
                const formData = new FormData();
                formData.append('prompt', prompt);
                formData.append('model', options.model || this.defaultVideoModel);
                formData.append('resolution', options.resolution || this.defaultVideoResolution);
                formData.append('aspect_ratio', options.aspect_ratio || this.defaultAspectRatio);

                if (options.file_urls) {
                    formData.append('file_urls', options.file_urls);
                }

                if (options.ref_history) {
                    formData.append('ref_history', options.ref_history);
                }

                response = await fetch(this.baseURL + this.endpoints.videoGenerate, {
                    method: 'POST',
                    headers: {
                        'x-api-key': this.apiKey
                    },
                    body: formData
                });
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.detail?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Check for immediate failure
            if (data.status === 3) {
                throw new Error(data.error_message || 'Video generation failed');
            }

            // Get UUID for polling
            const uuid = data.uuid;
            if (!uuid) {
                throw new Error('No UUID returned from video generation request');
            }

            // Step 2: Poll for completion
            return await this.pollVideoStatus(uuid, progressCallback);

        } catch (error) {
            console.error('Video generation error:', error);
            throw error;
        }
    }

    /**
     * Poll video generation status until completion
     * @param {string} uuid - Video generation UUID
     * @param {Function} progressCallback - Optional callback for progress updates
     * @returns {Promise<string>} Video URL
     */
    async pollVideoStatus(uuid, progressCallback = null) {
        const maxAttempts = 120; // 120 attempts * 3 seconds = 6 minutes max
        const pollInterval = 3000; // 3 seconds

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const url = this.useProxy
                    ? `${this.proxyBaseURL}${this.proxyEndpoints.jobStatus}/${uuid}`
                    : `${this.baseURL}${this.endpoints.jobStatus}/${uuid}`;

                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'x-api-key': this.apiKey
                    }
                });

                if (!response.ok) {
                    console.warn(`Status check failed (attempt ${attempt + 1})`);
                    await sleep(pollInterval);
                    continue;
                }

                const status = await response.json();

                // Report progress
                if (progressCallback) {
                    progressCallback(status.status_percentage || 0, status.status_desc || 'Processing...');
                }

                // Check if completed (status 2)
                if (status.status === 2) {
                    const videoUrl = status.generate_result || status.video_url || status.url;

                    if (!videoUrl) {
                        throw new Error('Video completed but no URL in response');
                    }

                    return videoUrl;
                }

                // Check if failed (status 3)
                if (status.status === 3) {
                    throw new Error(status.error_message || 'Video generation failed');
                }

                // Still processing (status 1), wait and retry
                await sleep(pollInterval);

            } catch (error) {
                if (error.message.includes('failed')) {
                    throw error;
                }
                console.warn(`Polling error (attempt ${attempt + 1}):`, error);
                await sleep(pollInterval);
            }
        }

        throw new Error(`Video generation timeout after ${maxAttempts * pollInterval / 1000} seconds`);
    }

    /**
     * Poll job status until completion
     * @param {string} jobId - Job ID
     * @param {string} type - Type (image or video)
     * @param {number} maxAttempts - Maximum polling attempts
     * @returns {Promise<string>} URL of generated content
     */
    async pollJobStatus(jobId, type = 'image', maxAttempts = 60) {
        const pollInterval = 2000; // 2 seconds

        for (let i = 0; i < maxAttempts; i++) {
            try {
                // Try different status endpoint patterns
                const endpoints = [
                    `/v1/status/${jobId}`,
                    `/v1/jobs/${jobId}`,
                    `/status/${jobId}`,
                    `/jobs/${jobId}`,
                    `/v1/${type}/status/${jobId}`,
                    `/api/status/${jobId}`
                ];

                for (const endpoint of endpoints) {
                    try {
                        const response = await this.fetchEndpoint(
                            this.baseURL + endpoint,
                            'GET',
                            null
                        );

                        if (response.ok) {
                            const status = await response.json();

                            // Check if completed
                            if (status.status === 'completed' ||
                                status.status === 'success' ||
                                status.state === 'completed') {

                                const url = type === 'video'
                                    ? this.extractVideoURL(status)
                                    : this.extractImageURL(status);

                                if (url) {
                                    return url;
                                }
                            }

                            // Check if failed
                            if (status.status === 'failed' ||
                                status.status === 'error' ||
                                status.state === 'failed') {
                                throw new Error(status.error || status.message || 'Generation failed');
                            }

                            // Still processing, log progress if available
                            if (status.progress) {
                                console.log(`Job ${jobId} progress: ${status.progress}%`);
                            }

                            // Break inner loop, endpoint works
                            break;
                        }
                    } catch (err) {
                        // Try next endpoint pattern
                        continue;
                    }
                }

                // Wait before next poll
                await sleep(pollInterval);

            } catch (error) {
                console.error(`Polling error (attempt ${i + 1}):`, error);
            }
        }

        throw new Error(`Job ${jobId} timeout after ${maxAttempts * pollInterval / 1000} seconds`);
    }

    /**
     * Handle API errors
     * @param {Object} error - Error object
     * @returns {string} User-friendly error message
     */
    handleAPIError(error) {
        if (error.message.includes('401') || error.message.includes('authentication')) {
            return getErrorMessage('INVALID_API_KEY');
        }

        if (error.message.includes('429') || error.message.includes('rate limit')) {
            return getErrorMessage('RATE_LIMIT_MINUTE');
        }

        if (error.message.includes('quota')) {
            return getErrorMessage('QUOTA_EXCEEDED');
        }

        if (error.message.includes('network') || error.message.includes('fetch')) {
            return getErrorMessage('NETWORK_ERROR');
        }

        return error.message;
    }

    /**
     * Set API key
     * @param {string} apiKey - New API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Get current configuration
     * @returns {Object} Configuration object
     */
    getConfig() {
        return {
            baseURL: this.baseURL,
            models: this.models,
            hasApiKey: !!this.apiKey
        };
    }
}

// ========== Export for module systems (optional) ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiGenAPI;
}
