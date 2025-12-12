/**
 * API HANDLER
 * Handles all GeminiGen API calls
 */

const APIHandler = {
    baseURL: window.location.origin, // Use proxy
    proxyEndpoints: {
        imageGenerate: '/api/geminigen/generate-image',
        videoGenerate: '/api/geminigen/generate-video',
        status: '/api/geminigen/status',
        test: '/api/geminigen/test'
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
     * Test API connection
     */
    async testConnection(apiKey) {
        try {
            const response = await fetch(this.baseURL + this.proxyEndpoints.test, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey
                }
            });

            const data = await response.json();

            if (data.success) {
                return {
                    success: true,
                    message: 'API connection successful!'
                };
            } else {
                return {
                    success: false,
                    message: this.getErrorMessage(data.error) || data.message
                };
            }
        } catch (error) {
            console.error('Connection test error:', error);
            return {
                success: false,
                message: this.getErrorMessage('NETWORK_ERROR')
            };
        }
    },

    /**
     * Generate image
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

            const response = await fetch(this.baseURL + this.proxyEndpoints.imageGenerate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Image generation failed');
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
     * Generate video
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

            const response = await fetch(this.baseURL + this.proxyEndpoints.videoGenerate, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Video generation failed');
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
     * Check status (for manual polling if needed)
     * NOTE: Primary updates come from webhooks
     */
    async checkStatus(apiKey, uuid) {
        try {
            const response = await fetch(`${this.baseURL}${this.proxyEndpoints.status}/${uuid}`, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Status check failed');
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
