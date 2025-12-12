/**
 * API HANDLER
 * Handles all GeminiGen API calls - DIRECT API CALLS (NO PROXY)
 */

const APIHandler = {
    baseURL: 'https://api.geminigen.ai',
    endpoints: {
        imageGenerate: '/uapi/v1/generate_image',
        videoGenerate: '/uapi/v1/video-gen/veo',
        status: '/uapi/v1/status'
    },

    /**
     * Error code mapping to friendly messages
     */
    errorMessages: {
        'API_KEY_REQUIRED': 'API key missing.',
        'USER_NOT_FOUND': 'User account not found.',
        'API_KEY_NOT_FOUND': 'Invalid API key.',
        'PREMIUM_PLAN_REQUIRED': 'Premium plan required.',
        'NOT_ENOUGH_CREDIT': 'You do not have enough credits.',
        'NOT_ENOUGH_AND_LOCK_CREDIT': 'Credits locked—check account.',
        'TEXT_TOO_LONG': 'Your text exceeds max length.',
        'FILE_TYPE_NOT_ALLOWED': 'Unsupported file type.',
        'MAXIMUM_FILE_SIZE_EXCEED': 'Uploaded file too large.',
        'GEMINI_RATE_LIMIT': 'Too many requests. Slow down.',
        'GEMINI_RAI_MEDIA_FILTERED': 'Content blocked by safety filters.',
        'FORBIDDEN': 'Permission denied.',
        'SYSTEM_ERROR': 'Internal server error.',
        'NETWORK_ERROR': 'Network connection failed.'
    },

    /**
     * Get friendly error message
     */
    getErrorMessage(errorCode) {
        return this.errorMessages[errorCode] || `Error: ${errorCode}`;
    },

    /**
     * Safe JSON parser - handles HTML 404 responses
     */
    safeJSONParse(text) {
        try {
            return JSON.parse(text);
        } catch (error) {
            // Handle HTML responses (404 pages, etc)
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                throw new Error('Server returned HTML instead of JSON - endpoint may not exist');
            }
            throw error;
        }
    },

    /**
     * Test API connection - DIRECT POST REQUEST
     */
    async testConnection(apiKey) {
        try {
            const response = await fetch(this.baseURL + this.endpoints.imageGenerate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify({
                    prompt: 'test validation',
                    model: 'imagen-pro'
                })
            });

            const rawText = await response.text();
            const data = this.safeJSONParse(rawText);

            if (response.ok) {
                return {
                    success: true,
                    message: 'API connection successful!'
                };
            } else {
                const errorMsg = data?.detail?.message || data?.message || `HTTP ${response.status}`;
                const errorCode = data?.detail?.error_code || 'UNKNOWN_ERROR';

                return {
                    success: false,
                    message: this.getErrorMessage(errorCode) || errorMsg
                };
            }
        } catch (error) {
            console.error('Connection test error:', error);
            return {
                success: false,
                message: error.message || this.getErrorMessage('NETWORK_ERROR')
            };
        }
    },

    /**
     * Generate image - DIRECT API CALL
     */
    async generateImage(apiKey, prompt, settings) {
        try {
            const body = {
                prompt: prompt,
                model: settings.model || 'imagen-pro',
                aspect_ratio: settings.aspectRatio || '16:9',
                style: settings.style || 'None'
            };

            // Add consistency locks if enabled
            if (settings.environmentLock) {
                body.prompt += ' Maintain identical environment, lighting, and atmosphere.';
            }
            if (settings.characterLock) {
                body.prompt += ' Keep same character appearance, face, body, clothing, and colors.';
            }

            // Add ref_history if provided
            if (settings.ref_history) {
                body.ref_history = settings.ref_history;
            }

            const response = await fetch(this.baseURL + this.endpoints.imageGenerate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify(body)
            });

            const rawText = await response.text();
            const data = this.safeJSONParse(rawText);

            if (!response.ok) {
                const errorMsg = data?.detail?.message || data?.message || 'Image generation failed';
                const errorCode = data?.detail?.error_code || null;
                throw new Error(errorCode ? this.getErrorMessage(errorCode) : errorMsg);
            }

            // Return UUID for tracking
            return {
                success: true,
                uuid: data.uuid,
                status: data.status,
                message: data.message
            };

        } catch (error) {
            console.error('Image generation error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Generate video - DIRECT API CALL
     */
    async generateVideo(apiKey, startImageUrl, endImageUrl, settings) {
        try {
            const prompt = `Create smooth cinematic 8-second transition from the starting frame to the ending frame. Maintain character identity, environment, lighting, colors, mood, and composition.`;

            const body = {
                prompt: prompt,
                model: settings.model || 'veo-3.1-fast',
                resolution: settings.resolution || '1080p',
                aspect_ratio: settings.aspectRatio || '16:9',
                file_urls: startImageUrl
            };

            // Add consistency locks
            if (settings.environmentConsistency) {
                body.prompt += ' Maintain identical environment and lighting throughout.';
            }
            if (settings.characterConsistency) {
                body.prompt += ' Keep character appearance exactly the same.';
            }

            // Add ref_history if provided
            if (settings.ref_history) {
                body.ref_history = settings.ref_history;
            }

            const response = await fetch(this.baseURL + this.endpoints.videoGenerate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify(body)
            });

            const rawText = await response.text();
            const data = this.safeJSONParse(rawText);

            if (!response.ok) {
                const errorMsg = data?.detail?.message || data?.message || 'Video generation failed';
                const errorCode = data?.detail?.error_code || null;
                throw new Error(errorCode ? this.getErrorMessage(errorCode) : errorMsg);
            }

            return {
                success: true,
                uuid: data.uuid,
                status: data.status,
                message: data.message
            };

        } catch (error) {
            console.error('Video generation error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    },

    /**
     * Check status - DIRECT API CALL
     * NOTE: Primary updates come from webhooks
     */
    async checkStatus(apiKey, uuid) {
        try {
            const response = await fetch(`${this.baseURL}${this.endpoints.status}/${uuid}`, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey
                }
            });

            const rawText = await response.text();
            const data = this.safeJSONParse(rawText);

            if (!response.ok) {
                throw new Error(data?.error || 'Status check failed');
            }

            return {
                success: true,
                data: data
            };

        } catch (error) {
            console.error('Status check error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIHandler;
}
