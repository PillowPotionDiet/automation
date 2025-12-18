/**
 * Identity Manager - Deterministic Consistency Architecture
 *
 * This module handles:
 * 1. Cryptographic seed generation (cyrb53 hash)
 * 2. Character/Environment identity management
 * 3. Master reference image generation
 * 4. Identity locking mechanism
 *
 * CRITICAL RULES:
 * - Seeds are NEVER sent to API
 * - Seeds are NEVER included in prompts
 * - Seeds bind: text identity + master image + future references
 * - Once locked, identities cannot be changed
 */

const IdentityManager = {

    /**
     * cyrb53 - Fast, high-quality 53-bit hash function
     * Produces deterministic hash: same input = same output
     *
     * @param {string} str - Input string to hash
     * @param {number} seed - Optional seed value
     * @returns {number} - 53-bit hash value
     */
    cyrb53(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed;
        let h2 = 0x41c6ce57 ^ seed;

        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }

        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    },

    /**
     * Generate deterministic identity seed
     * Seed = hash(name.toLowerCase() + ":" + attributes)
     *
     * @param {string} name - Character/Environment name
     * @param {string} attributes - Full attributes string (20+ for characters)
     * @returns {number} - Deterministic seed
     */
    generateIdentitySeed(name, attributes) {
        const identityString = `${name.toLowerCase()}:${attributes}`;
        return this.cyrb53(identityString);
    },

    /**
     * Create a character identity object
     *
     * @param {string} name - Character name
     * @param {string} attributes - Full attributes (20+ attributes)
     * @returns {object} - Character identity object
     */
    createCharacterIdentity(name, attributes) {
        return {
            name: name,
            seed: this.generateIdentitySeed(name, attributes),
            attributes: attributes,
            master_image_url: null,  // Set after generation
            locked: false
        };
    },

    /**
     * Create an environment identity object
     *
     * @param {string} name - Environment name
     * @param {string} attributes - Full description
     * @returns {object} - Environment identity object
     */
    createEnvironmentIdentity(name, attributes) {
        return {
            name: name,
            seed: this.generateIdentitySeed(name, attributes),
            attributes: attributes,
            master_image_url: null,  // Set after generation
            locked: false
        };
    },

    /**
     * Build prompt for character master image generation
     * IMPORTANT: Does NOT include seed in prompt
     *
     * @param {object} character - Character identity object
     * @returns {string} - Prompt for image generation
     */
    buildCharacterMasterPrompt(character) {
        return `Portrait of ${character.name}:
${character.attributes}

Style: Full body portrait, centered composition, neutral background, high quality, detailed features, consistent lighting.`;
    },

    /**
     * Build prompt for environment master image generation
     * IMPORTANT: Does NOT include seed in prompt
     *
     * @param {object} environment - Environment identity object
     * @returns {string} - Prompt for image generation
     */
    buildEnvironmentMasterPrompt(environment) {
        return `Environment scene - ${environment.name}:
${environment.attributes}

Style: Wide establishing shot, detailed environment, atmospheric lighting, cinematic composition.`;
    },

    /**
     * Build scene frame prompt with character/environment attributes
     * IMPORTANT: Seeds are NOT included in prompts
     *
     * @param {string} framePrompt - Original frame prompt
     * @param {array} characterNames - Array of character names in scene
     * @param {string} environmentName - Environment name
     * @param {object} globalState - GLOBAL_STATE with all identities
     * @returns {string} - Enhanced prompt with attributes
     */
    buildSceneFramePrompt(framePrompt, characterNames, environmentName, globalState) {
        let prompt = '';

        // Add character attributes
        if (characterNames && characterNames.length > 0) {
            prompt += '[CHARACTERS]\n';
            characterNames.forEach(name => {
                const char = globalState.characters[name.toLowerCase()];
                if (char) {
                    prompt += `${name}: ${char.attributes}\n\n`;
                }
            });
        }

        // Add environment attributes
        if (environmentName && globalState.environments[environmentName.toLowerCase()]) {
            const env = globalState.environments[environmentName.toLowerCase()];
            prompt += `[ENVIRONMENT]\n${environmentName}: ${env.attributes}\n\n`;
        }

        // Add scene action
        prompt += `[SCENE]\n${framePrompt}`;

        return prompt;
    },

    /**
     * Get reference images for a scene
     * Rules: Max 2 ref images per API call
     * - 1 character = 1 ref image
     * - 2+ characters = first 2 ref images
     *
     * @param {array} characterNames - Character names in scene
     * @param {object} globalState - GLOBAL_STATE with all identities
     * @returns {array} - Array of reference image URLs (max 2)
     */
    getCharacterRefImages(characterNames, globalState) {
        const refImages = [];

        if (!characterNames || characterNames.length === 0) {
            return refImages;
        }

        // Get up to 2 character reference images
        for (let i = 0; i < Math.min(characterNames.length, 2); i++) {
            const name = characterNames[i].toLowerCase();
            const char = globalState.characters[name];
            if (char && char.master_image_url) {
                refImages.push(char.master_image_url);
            }
        }

        return refImages;
    },

    /**
     * Validate that all identities are locked before proceeding
     *
     * @param {object} globalState - GLOBAL_STATE object
     * @returns {object} - { valid: boolean, missing: array }
     */
    validateIdentitiesLocked(globalState) {
        const missing = [];

        // Check all characters have master images
        Object.entries(globalState.characters || {}).forEach(([name, char]) => {
            if (!char.master_image_url) {
                missing.push(`Character: ${name}`);
            }
        });

        // Check all environments have master images
        Object.entries(globalState.environments || {}).forEach(([name, env]) => {
            if (!env.master_image_url) {
                missing.push(`Environment: ${name}`);
            }
        });

        return {
            valid: missing.length === 0 && globalState.locked === true,
            missing: missing
        };
    },

    /**
     * Lock all identities (called after master images generated)
     * Once locked, identities CANNOT be modified
     *
     * @param {object} globalState - GLOBAL_STATE object
     * @returns {object} - Updated globalState with locked=true
     */
    lockIdentities(globalState) {
        // Lock each character
        Object.keys(globalState.characters || {}).forEach(name => {
            globalState.characters[name].locked = true;
        });

        // Lock each environment
        Object.keys(globalState.environments || {}).forEach(name => {
            globalState.environments[name].locked = true;
        });

        // Lock global state
        globalState.locked = true;

        return globalState;
    },

    /**
     * Format seed for display (e.g., in seed pills)
     *
     * @param {string} name - Identity name
     * @param {number} seed - Seed value
     * @returns {string} - Formatted seed pill text
     */
    formatSeedPill(name, seed) {
        return `(${name}:${seed})`;
    },

    /**
     * Parse extracted characters from brain output
     *
     * @param {array} extractedChars - Array from brain pipeline
     * @returns {object} - Characters object keyed by lowercase name
     */
    parseExtractedCharacters(extractedChars) {
        const characters = {};

        extractedChars.forEach(char => {
            const name = char.name.toLowerCase().replace(/\s+/g, '_');
            characters[name] = this.createCharacterIdentity(char.name, char.content);
        });

        return characters;
    },

    /**
     * Parse extracted environments from brain output
     *
     * @param {array} extractedEnvs - Array from brain pipeline
     * @returns {object} - Environments object keyed by lowercase name
     */
    parseExtractedEnvironments(extractedEnvs) {
        const environments = {};

        extractedEnvs.forEach(env => {
            const name = env.name.toLowerCase().replace(/\s+/g, '_');
            environments[name] = this.createEnvironmentIdentity(env.name, env.content);
        });

        return environments;
    },

    /**
     * Estimate credits for identity generation
     *
     * @param {number} characterCount - Number of characters
     * @param {number} environmentCount - Number of environments
     * @param {number} creditsPerImage - Credits per image (depends on model)
     * @returns {object} - Credits breakdown
     */
    estimateCredits(characterCount, environmentCount, creditsPerImage = 1) {
        return {
            characters: characterCount * creditsPerImage,
            environments: environmentCount * creditsPerImage,
            total: (characterCount + environmentCount) * creditsPerImage
        };
    },

    /**
     * Generate master images for all characters and environments
     * This is an async function that calls the API
     *
     * @param {object} globalState - GLOBAL_STATE object
     * @param {string} apiKey - API key
     * @param {object} settings - Image generation settings
     * @param {function} progressCallback - Callback for progress updates
     * @returns {object} - { success: boolean, globalState: object, creditsUsed: number }
     */
    async generateMasterImages(globalState, apiKey, settings, progressCallback) {
        const results = {
            success: true,
            globalState: globalState,
            creditsUsed: 0,
            errors: []
        };

        const characters = Object.entries(globalState.characters || {});
        const environments = Object.entries(globalState.environments || {});
        const total = characters.length + environments.length;
        let completed = 0;

        // Generate character master images
        for (const [key, char] of characters) {
            if (progressCallback) {
                progressCallback(`Generating master image for ${char.name}... (${completed + 1}/${total})`);
            }

            try {
                const prompt = this.buildCharacterMasterPrompt(char);
                const result = await APIHandler.generateImage(apiKey, prompt, settings);

                if (result.success) {
                    // Poll for completion
                    const finalResult = await this.pollForCompletion(result.uuid);

                    if (finalResult.success) {
                        globalState.characters[key].master_image_url = finalResult.media_url;
                        results.creditsUsed += finalResult.used_credit || 0;
                    } else {
                        results.errors.push(`Failed to generate ${char.name}: ${finalResult.message}`);
                        results.success = false;
                    }
                } else {
                    results.errors.push(`API error for ${char.name}: ${result.message}`);
                    results.success = false;
                }
            } catch (error) {
                results.errors.push(`Exception for ${char.name}: ${error.message}`);
                results.success = false;
            }

            completed++;
        }

        // Generate environment master images
        for (const [key, env] of environments) {
            if (progressCallback) {
                progressCallback(`Generating master image for ${env.name}... (${completed + 1}/${total})`);
            }

            try {
                const prompt = this.buildEnvironmentMasterPrompt(env);
                const result = await APIHandler.generateImage(apiKey, prompt, settings);

                if (result.success) {
                    // Poll for completion
                    const finalResult = await this.pollForCompletion(result.uuid);

                    if (finalResult.success) {
                        globalState.environments[key].master_image_url = finalResult.media_url;
                        results.creditsUsed += finalResult.used_credit || 0;
                    } else {
                        results.errors.push(`Failed to generate ${env.name}: ${finalResult.message}`);
                        results.success = false;
                    }
                } else {
                    results.errors.push(`API error for ${env.name}: ${result.message}`);
                    results.success = false;
                }
            } catch (error) {
                results.errors.push(`Exception for ${env.name}: ${error.message}`);
                results.success = false;
            }

            completed++;
        }

        // Lock identities if all successful
        if (results.success) {
            results.globalState = this.lockIdentities(globalState);
        }

        return results;
    },

    /**
     * Poll webhook status until completion
     *
     * @param {string} uuid - Request UUID
     * @param {number} maxAttempts - Maximum polling attempts
     * @param {number} interval - Polling interval in ms
     * @returns {object} - Final result
     */
    async pollForCompletion(uuid, maxAttempts = 120, interval = 3000) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const response = await fetch(`webhook-status.php?uuid=${uuid}`);
                const data = await response.json();

                if (data.status === 2) {
                    // Completed
                    return {
                        success: true,
                        media_url: data.media_url,
                        used_credit: data.used_credit || 0
                    };
                } else if (data.status === 3) {
                    // Failed
                    return {
                        success: false,
                        message: data.error_message || 'Generation failed'
                    };
                }

                // Still processing, wait and retry
                await new Promise(resolve => setTimeout(resolve, interval));

            } catch (error) {
                console.error('Polling error:', error);
            }
        }

        return {
            success: false,
            message: 'Timeout waiting for generation'
        };
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IdentityManager;
}
