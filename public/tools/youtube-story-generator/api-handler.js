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
     * Extract detailed error message from API response
     */
    extractErrorMessage(data) {
        // Check for detailed error in geminigen_raw
        if (data.geminigen_raw && data.geminigen_raw.detail) {
            if (data.geminigen_raw.detail.error_message) {
                return data.geminigen_raw.detail.error_message;
            }
            if (data.geminigen_raw.detail.error_code) {
                return this.getErrorMessage(data.geminigen_raw.detail.error_code);
            }
        }

        // Fall back to top-level error_code or message
        if (data.error_code) {
            return this.getErrorMessage(data.error_code);
        }

        return data.message || 'Unknown error occurred';
    },

    /**
     * Generate image - USES BACKEND PROXY (NO CORS)
     */
    async generateImage(apiKey, prompt, settings) {
        try {
            let finalPrompt = prompt;

            // CONSISTENCY LOCK INJECTION SYSTEM
            // Prepend master identity descriptions to enforce consistency
            let identityPrefix = '';

            // Inject character master identities if lock enabled
            if (settings.characterLock && typeof StateManager !== 'undefined') {
                const extractedChars = StateManager.getExtractedCharacters();
                if (extractedChars && extractedChars.length > 0) {
                    extractedChars.forEach(char => {
                        identityPrefix += `[IDENTITY: ${char.name}] ${char.content}\n`;
                    });
                }
            }

            // Inject environment master identities if lock enabled
            if (settings.environmentLock && typeof StateManager !== 'undefined') {
                const extractedEnvs = StateManager.getExtractedEnvironments();
                if (extractedEnvs && extractedEnvs.length > 0) {
                    extractedEnvs.forEach(env => {
                        identityPrefix += `[ENVIRONMENT: ${env.name}] ${env.content}\n`;
                    });
                }
            }

            // Prepend identity prefix to original prompt
            if (identityPrefix) {
                finalPrompt = identityPrefix + '\n' + prompt;
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
                throw new Error(this.extractErrorMessage(data));
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
            // UNIVERSAL VIDEO PROMPT (as specified in requirements)
            let basePrompt = `Please generate a high-quality, cinematic, photorealistic video that smoothly transitions from the provided STARTING FRAME image to the provided ENDING FRAME image.

Ensure:
- Natural motion continuity
- Stable camera movement
- Temporal realism
- Cinematic flow
- No character or environment drift

Characters must retain:
- Exact face structure
- Hair, beard, clothing, body proportions
- Identity details as defined in Master Identities

Environment must retain:
- Exact layout, lighting, atmosphere
- Structural and spatial consistency

The video must feel like a single continuous shot connecting the two frames naturally.`;

            // CONSISTENCY LOCK INJECTION SYSTEM
            // Prepend master identity descriptions to enforce consistency
            let identityPrefix = '';

            // Inject character master identities if consistency enabled
            if (settings.characterConsistency && typeof StateManager !== 'undefined') {
                const extractedChars = StateManager.getExtractedCharacters();
                if (extractedChars && extractedChars.length > 0) {
                    identityPrefix += '[CHARACTERS]\n';
                    extractedChars.forEach(char => {
                        identityPrefix += `[IDENTITY: ${char.name}] ${char.content}\n`;
                    });
                    identityPrefix += '\n';
                }
            }

            // Inject environment master identities if consistency enabled
            if (settings.environmentConsistency && typeof StateManager !== 'undefined') {
                const extractedEnvs = StateManager.getExtractedEnvironments();
                if (extractedEnvs && extractedEnvs.length > 0) {
                    identityPrefix += '[ENVIRONMENT]\n';
                    extractedEnvs.forEach(env => {
                        identityPrefix += `[ENVIRONMENT: ${env.name}] ${env.content}\n`;
                    });
                    identityPrefix += '\n';
                }
            }

            // Prepend identity prefix to base prompt
            let finalPrompt = basePrompt;
            if (identityPrefix) {
                finalPrompt = identityPrefix + basePrompt;
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
                throw new Error(this.extractErrorMessage(data));
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
                throw new Error(this.extractErrorMessage(data));
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
     * Generate text with OpenAI - USES BACKEND PROXY (NO CORS)
     * Returns response immediately (no webhook needed)
     */
    async generateTextOpenAI(apiKey, prompt, systemInstruction = "", model = "gpt-4o-mini", temperature = 0.7) {
        try {
            const requestBody = {
                apiKey: apiKey,
                prompt: prompt,
                model: model,
                temperature: temperature
            };

            // Add system instruction if provided
            if (systemInstruction) {
                requestBody.systemInstruction = systemInstruction;
            }

            const response = await fetch('/v2/api/openai-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'OpenAI request failed');
            }

            // OpenAI returns response immediately
            return {
                success: true,
                responseText: data.response_text,
                model: data.model,
                usage: data.usage
            };

        } catch (error) {
            console.error('OpenAI text generation error:', error);
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
    },

    /**
     * Get generation history - DIRECT API CALL
     * Retrieves all past generations (images + videos) with pagination
     */
    async getHistory(apiKey, options = {}) {
        try {
            const params = new URLSearchParams({
                filter_by: options.filter_by || 'all',
                items_per_page: options.items_per_page || 10,
                page: options.page || 1
            });

            const response = await fetch(`${this.baseURL}/uapi/v1/histories?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey
                }
            });

            const rawText = await response.text();
            const data = this.safeJSONParse(rawText);

            if (!response.ok) {
                throw new Error(data?.error || data?.message || 'Failed to fetch history');
            }

            return {
                success: true,
                data: data
            };

        } catch (error) {
            console.error('History fetch error:', error);
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
