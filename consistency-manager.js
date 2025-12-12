/**
 * CONSISTENCY MANAGER
 * Automatic character and environment consistency using Define & Inject Pattern
 */

class ConsistencyManager {
    constructor() {
        // Automatically extracted profiles
        this.characters = {}; // { characterName: { masterIdentity, seed } }
        this.environment = null; // { description, lighting, setting }
        this.analysisComplete = false;

        // Auto-enable consistency (always on)
        this.characterConsistencyEnabled = true;
        this.environmentConsistencyEnabled = true;

        // Load from storage
        this.loadFromStorage();
    }

    /**
     * Load consistency settings from localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem('consistencyProfiles');
            if (data) {
                const profiles = JSON.parse(data);
                this.characters = profiles.characters || {};
                this.environment = profiles.environment || null;
                this.analysisComplete = profiles.analysisComplete || false;
            }
        } catch (error) {
            console.error('Error loading consistency profiles:', error);
        }
    }

    /**
     * Save consistency settings to localStorage
     */
    saveToStorage() {
        try {
            const profiles = {
                characters: this.characters,
                environment: this.environment,
                analysisComplete: this.analysisComplete,
                lastUpdated: Date.now()
            };
            localStorage.setItem('consistencyProfiles', JSON.stringify(profiles));
        } catch (error) {
            console.error('Error saving consistency profiles:', error);
        }
    }

    /**
     * PHASE A: Analyze script and extract Master Identity profiles
     * This uses AI to automatically identify characters and environment
     * @param {string} script - The full script text
     * @param {Object} api - API client instance
     * @returns {Promise<Object>} Extracted profiles
     */
    async analyzeScript(script, api) {
        addLog('info', 'Phase A: Analyzing script for character and environment profiles...');

        try {
            // Use the AI to analyze the script
            const analysisPrompt = this.buildAnalysisPrompt(script);

            // For now, we'll use a simpler heuristic approach since we don't have a text analysis endpoint
            // In production, you'd call: await api.analyzeText(analysisPrompt)
            const profiles = this.extractProfilesHeuristically(script);

            this.characters = profiles.characters;
            this.environment = profiles.environment;
            this.analysisComplete = true;

            this.saveToStorage();

            addLog('success', `Extracted ${Object.keys(this.characters).length} character profiles and environment settings`);

            return profiles;

        } catch (error) {
            console.error('Error analyzing script:', error);
            addLog('error', 'Failed to analyze script for consistency profiles');
            throw error;
        }
    }

    /**
     * Build analysis prompt for AI
     * @param {string} script - The script text
     * @returns {string} Analysis prompt
     */
    buildAnalysisPrompt(script) {
        return `Analyze this script and extract character and environment information for visual consistency:

SCRIPT:
${script}

YOUR TASK:
1. Identify all characters mentioned or implied
2. For each character, create a "Master Identity" description that MUST include:
   - Exact hair style and color
   - Exact eye color and skin tone
   - Specific body type and age
   - Exact clothing that does NOT change
   - Any distinctive features

3. Identify the primary environment/setting and describe:
   - Location type (beach, city, forest, etc.)
   - Lighting conditions (sunny, overcast, golden hour, etc.)
   - Time of day
   - Weather conditions
   - Atmosphere and mood

Return the information in this exact JSON format:
{
  "characters": {
    "CharacterName": {
      "masterIdentity": "Detailed visual description here",
      "ageRange": "25-30",
      "gender": "female"
    }
  },
  "environment": {
    "description": "Primary setting description",
    "lighting": "Lighting description",
    "timeOfDay": "Time of day",
    "weather": "Weather conditions"
  }
}`;
    }

    /**
     * Heuristic extraction (fallback when no text analysis API available)
     * @param {string} script - The script text
     * @returns {Object} Extracted profiles
     */
    extractProfilesHeuristically(script) {
        const profiles = {
            characters: {},
            environment: null
        };

        // Detect common character indicators
        const characterPatterns = [
            /(?:young |old )?(?:woman|man|girl|boy|person|character)/gi,
            /(?:she|he) (?:walks|runs|stands|sits)/gi
        ];

        // Detect pronouns to infer character presence
        const hasCharacter = /\b(?:she|he|they|woman|man|person|character)\b/i.test(script);

        if (hasCharacter) {
            // Extract gender from script
            const isFemale = /\b(?:she|her|woman|girl)\b/i.test(script);
            const isMale = /\b(?:he|him|man|boy)\b/i.test(script);

            const characterName = isFemale ? 'Woman' : isMale ? 'Man' : 'Person';

            // Generate Master Identity based on script context
            profiles.characters[characterName] = {
                masterIdentity: this.generateMasterIdentity(script, characterName),
                seed: Math.floor(Math.random() * 1000000),
                gender: isFemale ? 'female' : isMale ? 'male' : 'person'
            };
        }

        // Extract environment
        profiles.environment = this.extractEnvironment(script);

        return profiles;
    }

    /**
     * Generate Master Identity description from script
     * @param {string} script - The script text
     * @param {string} characterName - Character identifier
     * @returns {string} Master Identity description
     */
    generateMasterIdentity(script, characterName) {
        const lowerScript = script.toLowerCase();

        // Default templates based on detected character
        const isFemale = characterName === 'Woman';

        let identity = isFemale
            ? 'Young woman, age 25-30, '
            : 'Young man, age 25-30, ';

        // Hair detection
        if (/long.*hair|flowing.*hair/.test(lowerScript)) {
            identity += 'long flowing brown hair, ';
        } else if (/short.*hair/.test(lowerScript)) {
            identity += 'short brown hair, ';
        } else {
            identity += isFemale ? 'shoulder-length brown hair, ' : 'short dark hair, ';
        }

        // Clothing detection from script context
        if (/beach|shore|sand|ocean|sea/.test(lowerScript)) {
            identity += isFemale
                ? 'white flowing summer dress, '
                : 'light blue casual shirt and beige shorts, ';
        } else if (/city|urban|street/.test(lowerScript)) {
            identity += isFemale
                ? 'black casual jeans and white blouse, '
                : 'dark jeans and gray t-shirt, ';
        } else {
            identity += isFemale
                ? 'casual white dress, '
                : 'casual clothing, ';
        }

        // Add consistent features
        identity += isFemale
            ? 'blue eyes, fair skin tone, average build, natural makeup'
            : 'brown eyes, light skin tone, athletic build';

        return identity;
    }

    /**
     * Extract environment from script
     * @param {string} script - The script text
     * @returns {Object} Environment description
     */
    extractEnvironment(script) {
        const lowerScript = script.toLowerCase();

        let environment = {
            description: '',
            lighting: '',
            timeOfDay: '',
            weather: ''
        };

        // Location detection
        if (/beach|shore|sand|ocean|sea|waves/.test(lowerScript)) {
            environment.description = 'Sunny beach with golden sand and turquoise ocean';
            environment.lighting = 'Warm natural sunlight with soft shadows';
            environment.weather = 'Clear sunny day with calm conditions';
        } else if (/city|urban|street|building/.test(lowerScript)) {
            environment.description = 'Modern urban city environment with buildings';
            environment.lighting = 'Natural daylight with urban shadows';
            environment.weather = 'Clear day';
        } else if (/forest|trees|woods|nature/.test(lowerScript)) {
            environment.description = 'Natural forest setting with trees and vegetation';
            environment.lighting = 'Dappled sunlight through trees';
            environment.weather = 'Clear day with gentle breeze';
        } else {
            environment.description = 'Neutral outdoor setting';
            environment.lighting = 'Natural balanced lighting';
            environment.weather = 'Clear conditions';
        }

        // Time detection
        if (/sunset|golden hour|dusk/.test(lowerScript)) {
            environment.timeOfDay = 'Golden hour sunset';
            environment.lighting = 'Warm golden hour lighting with long shadows';
        } else if (/sunrise|dawn|morning/.test(lowerScript)) {
            environment.timeOfDay = 'Early morning';
            environment.lighting = 'Soft morning light';
        } else if (/night|evening|dark/.test(lowerScript)) {
            environment.timeOfDay = 'Evening/night';
            environment.lighting = 'Low light with artificial sources';
        } else {
            environment.timeOfDay = 'Midday';
        }

        return environment;
    }

    /**
     * PHASE B: Build prompt with Define & Inject pattern
     * Constructs three-layer prompt structure for maximum consistency
     * @param {string} sceneAction - The specific action happening in this scene
     * @param {string} characterName - Character involved (optional)
     * @returns {string} Fully structured prompt
     */
    buildConsistentPrompt(sceneAction, characterName = null) {
        if (!this.analysisComplete) {
            // Fallback to simple prompt if analysis hasn't run
            return sceneAction;
        }

        let prompt = '';

        // LAYER 1: PSEUDO-CONFIG (JSON-like instructions)
        prompt += 'RENDER CONFIGURATION:\n';
        prompt += '{\n';
        prompt += '  "character_consistency": "strong",\n';
        prompt += '  "identity_lock": "hard",\n';
        prompt += '  "preserve_identity": true,\n';
        prompt += '  "suppress_randomness": true,\n';
        prompt += '  "environment_consistency": "strong",\n';
        prompt += '  "background_lock": "hard",\n';
        prompt += '  "style_consistency": "strong"\n';
        prompt += '}\n\n';

        // LAYER 2: IDENTITY LOCK (Character Master Identity Injection)
        if (characterName && this.characters[characterName]) {
            const character = this.characters[characterName];
            prompt += `[IDENTITY LOCK: ${characterName}]\n`;
            prompt += `VISUAL_TRAITS: ${character.masterIdentity}\n`;
            prompt += 'INSTRUCTION: Maintain these traits EXACTLY. Do not change clothing, hair, or face details.\n\n';
        } else if (Object.keys(this.characters).length > 0) {
            // Use first character if name not specified
            const firstCharacterName = Object.keys(this.characters)[0];
            const character = this.characters[firstCharacterName];
            prompt += `[IDENTITY LOCK: ${firstCharacterName}]\n`;
            prompt += `VISUAL_TRAITS: ${character.masterIdentity}\n`;
            prompt += 'INSTRUCTION: Maintain these traits EXACTLY. Do not change clothing, hair, or face details.\n\n';
        }

        // LAYER 2b: ENVIRONMENT LOCK
        if (this.environment) {
            prompt += '[ENVIRONMENT LOCK: ACTIVE]\n';
            prompt += `SETTING: ${this.environment.description}\n`;
            prompt += `LIGHTING: ${this.environment.lighting}\n`;
            prompt += `TIME: ${this.environment.timeOfDay}\n`;
            prompt += `WEATHER: ${this.environment.weather}\n`;
            prompt += 'INSTRUCTION: Maintain consistent background, lighting, and weather style. Do not deviate from established environment.\n\n';
        }

        // LAYER 3: SCENE ACTION
        prompt += `SCENE ACTION: ${sceneAction}\n`;

        return prompt;
    }

    /**
     * Legacy method for backward compatibility
     * @param {string} basePrompt - Original prompt
     * @returns {string} Enhanced prompt
     */
    applyToPrompt(basePrompt) {
        return this.buildConsistentPrompt(basePrompt);
    }

    /**
     * Get image generation options with consistency settings
     * @param {string} characterName - Character name (optional)
     * @returns {Object} Options object for API
     */
    getImageGenerationOptions(characterName = null) {
        const options = {};

        // Use character seed if available
        if (characterName && this.characters[characterName]) {
            options.seed = this.characters[characterName].seed;
        } else if (Object.keys(this.characters).length > 0) {
            const firstCharacterName = Object.keys(this.characters)[0];
            options.seed = this.characters[firstCharacterName].seed;
        }

        return options;
    }

    /**
     * Get video generation options with consistency settings
     * @param {string} characterName - Character name (optional)
     * @returns {Object} Options object for API
     */
    getVideoGenerationOptions(characterName = null) {
        const options = {};

        // Use character seed for videos
        if (characterName && this.characters[characterName]) {
            options.seed = this.characters[characterName].seed;
        } else if (Object.keys(this.characters).length > 0) {
            const firstCharacterName = Object.keys(this.characters)[0];
            options.seed = this.characters[firstCharacterName].seed;
        }

        return options;
    }

    /**
     * Validate consistency settings
     * @returns {Object} Validation result
     */
    validate() {
        return {
            isValid: this.analysisComplete,
            warnings: this.analysisComplete ? [] : ['Script analysis not yet performed']
        };
    }

    /**
     * Get active profiles summary
     * @returns {Object} Summary of extracted profiles
     */
    getExtractedProfiles() {
        return {
            characters: this.characters,
            environment: this.environment,
            analysisComplete: this.analysisComplete
        };
    }

    /**
     * Get consistency info HTML for display
     * @returns {string} HTML string
     */
    getConsistencyInfoHTML() {
        if (!this.analysisComplete) {
            return `<div class="consistency-warning">
                ⚠️ Script analysis pending. Consistency will be applied after analysis.
            </div>`;
        }

        let html = '<div class="consistency-profiles">';

        // Show extracted characters
        if (Object.keys(this.characters).length > 0) {
            html += '<div class="profile-section">';
            html += '<h4>👤 Detected Characters & Master Identities:</h4>';

            Object.entries(this.characters).forEach(([name, data]) => {
                html += `<div class="character-profile">
                    <strong>${name}</strong> (Seed: ${data.seed})<br>
                    <em>${data.masterIdentity}</em>
                </div>`;
            });

            html += '</div>';
        }

        // Show extracted environment
        if (this.environment) {
            html += '<div class="profile-section">';
            html += '<h4>🌍 Detected Environment Settings:</h4>';
            html += `<div class="environment-profile">
                <strong>Setting:</strong> ${this.environment.description}<br>
                <strong>Lighting:</strong> ${this.environment.lighting}<br>
                <strong>Time:</strong> ${this.environment.timeOfDay}<br>
                <strong>Weather:</strong> ${this.environment.weather}
            </div>`;
            html += '</div>';
        }

        html += '<div class="profile-note">';
        html += '<small>✅ These profiles will be automatically injected into every image and video generation prompt to ensure maximum consistency.</small>';
        html += '</div>';

        html += '</div>';

        return html;
    }

    /**
     * Reset all consistency settings
     */
    reset() {
        this.characters = {};
        this.environment = null;
        this.analysisComplete = false;
        this.saveToStorage();
        console.log('Consistency profiles reset');
    }

    /**
     * Get consistency tags for logging
     * @returns {string} Tags string for display
     */
    getConsistencyTags() {
        if (!this.analysisComplete) {
            return 'Analysis Pending';
        }

        const tags = [];

        if (Object.keys(this.characters).length > 0) {
            tags.push(`👤 ${Object.keys(this.characters).length} Character(s)`);
        }

        if (this.environment) {
            tags.push('🌍 Environment');
        }

        return tags.join(' | ') || 'No profiles';
    }

    /**
     * Export consistency profiles
     * @returns {Object} Profiles object
     */
    exportProfiles() {
        return {
            characters: this.characters,
            environment: this.environment,
            analysisComplete: this.analysisComplete,
            exportedAt: new Date().toISOString()
        };
    }

    /**
     * Import consistency profiles
     * @param {Object} profiles - Profiles object
     */
    importProfiles(profiles) {
        if (profiles.characters) {
            this.characters = profiles.characters;
        }

        if (profiles.environment) {
            this.environment = profiles.environment;
        }

        this.analysisComplete = profiles.analysisComplete || false;

        this.saveToStorage();
        console.log('Consistency profiles imported');
    }
}

// ========== Export for module systems (optional) ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConsistencyManager;
}
