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
     * Test API connection - USES BACKEND PROXY (NO CORS)
     */
    async testConnection(apiKey) {
        console.log("TEST CONNECTION STARTED", apiKey);

        const response = await fetch('/v2/api/test-key.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: apiKey
            })
        });

        const result = await response.json();
        console.log("TEST CONNECTION RESULT:", result);
        return result;
    },

    /**
     * Generate image - USES BACKEND PROXY (NO CORS)
     */
    async generateImage(apiKey, prompt, settings) {
        try {
            let finalPrompt = prompt;

            // Add consistency locks if enabled
            if (settings.environmentLock) {
                finalPrompt += ' Maintain identical environment, lighting, and atmosphere.';
            }
            if (settings.characterLock) {
                finalPrompt += ' Keep same character appearance, face, body, clothing, and colors.';
            }

            const requestBody = {
                apiKey: apiKey,
                prompt: finalPrompt,
                model: settings.model || 'nanobanana-pro',
                aspectRatio: settings.aspectRatio || '16:9',
                style: settings.style || 'None'
            };

            // Add ref_history if provided
            if (settings.ref_history) {
                requestBody.refHistory = settings.ref_history;
            }

            const response = await fetch('/v2/api/generate-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!data.success) {
                const errorCode = data.error_code;
                throw new Error(errorCode ? this.getErrorMessage(errorCode) : data.message);
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
     * Generate video - USES BACKEND PROXY (NO CORS)
     */
    async generateVideo(apiKey, startImageUrl, endImageUrl, settings) {
        try {
            let finalPrompt = `Create smooth cinematic 8-second transition from the starting frame to the ending frame. Maintain character identity, environment, lighting, colors, mood, and composition.`;

            // Add consistency locks
            if (settings.environmentConsistency) {
                finalPrompt += ' Maintain identical environment and lighting throughout.';
            }
            if (settings.characterConsistency) {
                finalPrompt += ' Keep character appearance exactly the same.';
            }

            const requestBody = {
                apiKey: apiKey,
                prompt: finalPrompt,
                startImage: startImageUrl,
                endImage: endImageUrl,
                model: settings.model || 'veo-3.1-fast',
                aspectRatio: settings.aspectRatio || '16:9'
            };

            // Add ref_history if provided
            if (settings.ref_history) {
                requestBody.refHistory = settings.ref_history;
            }

            const response = await fetch('/v2/api/generate-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!data.success) {
                const errorCode = data.error_code;
                throw new Error(errorCode ? this.getErrorMessage(errorCode) : data.message);
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
     * Generate text - USES BACKEND PROXY (NO CORS)
     * Used for AI-powered script splitting into scenes
     */
    async generateText(apiKey, prompt, systemInstruction = "", temperature = 0.7) {
        try {
            const requestBody = {
                apiKey: apiKey,
                prompt: prompt,
                model: 'gemini-2.5-pro',
                temperature: temperature
            };

            // Add system instruction if provided
            if (systemInstruction) {
                requestBody.systemInstruction = systemInstruction;
            }

            const response = await fetch('/v2/api/generate-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!data.success) {
                const errorCode = data.error_code;
                throw new Error(errorCode ? this.getErrorMessage(errorCode) : data.message);
            }

            // Return UUID for webhook tracking
            return {
                success: true,
                uuid: data.uuid,
                status: data.status,
                message: data.message
            };

        } catch (error) {
            console.error('Text generation error:', error);
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
