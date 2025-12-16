/**
 * STATE MANAGER
 * Manages global state across all 4 pages using localStorage
 */

const StateManager = {
    // Keys for localStorage
    keys: {
        apiKey: 'geminigen_api_key',
        webhookConfigured: 'webhook_configured',
        aiProviderSettings: 'ai_provider_settings',
        brainType: 'brain_type',
        extractedCharacters: 'extracted_characters',
        extractedEnvironments: 'extracted_environments',
        scriptData: 'script_data',
        imageSettings: 'image_settings',
        videoSettings: 'video_settings',
        scenes: 'scenes',
        characterDefinitions: 'character_definitions',
        generatedImages: 'generated_images',
        generatedVideos: 'generated_videos',
        activeRequests: 'active_requests',
        creditsUsed: 'credits_used',
        paragraphs: 'paragraphs'
    },

    /**
     * Save data to localStorage
     */
    save(key, value) {
        try {
            localStorage.setItem(this.keys[key], JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },

    /**
     * Load data from localStorage
     */
    load(key) {
        try {
            const data = localStorage.getItem(this.keys[key]);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    },

    /**
     * Remove data from localStorage
     */
    remove(key) {
        localStorage.removeItem(this.keys[key]);
    },

    /**
     * Clear all app data
     */
    clearAll() {
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
    },

    /**
     * Check if user has completed a specific page
     */
    hasCompletedPage(pageNumber) {
        switch(pageNumber) {
            case 1:
                return !!this.load('apiKey') && !!this.load('scriptData');
            case 2:
                return !!this.load('scenes');
            case 3:
                return !!this.load('generatedImages');
            case 4:
                return !!this.load('generatedVideos');
            default:
                return false;
        }
    },

    /**
     * Get API key
     */
    getApiKey() {
        return this.load('apiKey');
    },

    /**
     * Save API key
     */
    saveApiKey(key) {
        return this.save('apiKey', key);
    },

    /**
     * Get webhook configured status
     */
    isWebhookConfigured() {
        return this.load('webhookConfigured') === true;
    },

    /**
     * Set webhook configured status
     */
    setWebhookConfigured(status) {
        return this.save('webhookConfigured', status);
    },

    /**
     * Get script data
     */
    getScriptData() {
        return this.load('scriptData');
    },

    /**
     * Save script data
     */
    saveScriptData(data) {
        return this.save('scriptData', data);
    },

    /**
     * Get scenes
     */
    getScenes() {
        return this.load('scenes') || [];
    },

    /**
     * Save scenes
     */
    saveScenes(scenes) {
        return this.save('scenes', scenes);
    },

    /**
     * Get image settings
     */
    getImageSettings() {
        return this.load('imageSettings');
    },

    /**
     * Save image settings
     */
    saveImageSettings(settings) {
        return this.save('imageSettings', settings);
    },

    /**
     * Get video settings
     */
    getVideoSettings() {
        return this.load('videoSettings');
    },

    /**
     * Save video settings
     */
    saveVideoSettings(settings) {
        return this.save('videoSettings', settings);
    },

    /**
     * Get generated images
     */
    getGeneratedImages() {
        return this.load('generatedImages') || {};
    },

    /**
     * Save generated images
     */
    saveGeneratedImages(images) {
        return this.save('generatedImages', images);
    },

    /**
     * Get generated videos
     */
    getGeneratedVideos() {
        return this.load('generatedVideos') || {};
    },

    /**
     * Save generated videos
     */
    saveGeneratedVideos(videos) {
        return this.save('generatedVideos', videos);
    },

    /**
     * Get active requests
     */
    getActiveRequests() {
        return this.load('activeRequests') || [];
    },

    /**
     * Save active requests
     */
    saveActiveRequests(requests) {
        return this.save('activeRequests', requests);
    },

    /**
     * Add active request
     */
    addActiveRequest(request) {
        const requests = this.getActiveRequests();
        requests.push(request);
        this.saveActiveRequests(requests);
    },

    /**
     * Remove active request by UUID
     */
    removeActiveRequest(uuid) {
        const requests = this.getActiveRequests();
        const filtered = requests.filter(r => r.uuid !== uuid);
        this.saveActiveRequests(filtered);
    },

    /**
     * Find active request by UUID
     */
    findActiveRequest(uuid) {
        const requests = this.getActiveRequests();
        return requests.find(r => r.uuid === uuid);
    },

    /**
     * Get AI provider settings
     */
    getAIProviderSettings() {
        return this.load('aiProviderSettings') || {
            provider: 'openai',
            openaiKey: '',
            openaiModel: 'gpt-4o-mini'
        };
    },

    /**
     * Save AI provider settings
     */
    saveAIProviderSettings(settings) {
        return this.save('aiProviderSettings', settings);
    },

    /**
     * Get character definitions
     */
    getCharacterDefinitions() {
        return this.load('characterDefinitions') || [];
    },

    /**
     * Save character definitions
     */
    saveCharacterDefinitions(characters) {
        return this.save('characterDefinitions', characters);
    },

    /**
     * Get brain type (storyboard or geminigen)
     */
    getBrainType() {
        return this.load('brainType') || 'storyboard';
    },

    /**
     * Save brain type
     */
    saveBrainType(brainType) {
        return this.save('brainType', brainType);
    },

    /**
     * Get extracted characters (from GeminiGen Brain)
     */
    getExtractedCharacters() {
        return this.load('extractedCharacters') || [];
    },

    /**
     * Save extracted characters
     */
    saveExtractedCharacters(characters) {
        return this.save('extractedCharacters', characters);
    },

    /**
     * Get extracted environments (from GeminiGen Brain)
     */
    getExtractedEnvironments() {
        return this.load('extractedEnvironments') || [];
    },

    /**
     * Save extracted environments
     */
    saveExtractedEnvironments(environments) {
        return this.save('extractedEnvironments', environments);
    },

    /**
     * Get credits used
     */
    getCreditsUsed() {
        return this.load('creditsUsed') || {
            characterExtraction: 0,
            environmentExtraction: 0,
            paragraphSplitting: 0,
            sceneGeneration: 0,
            frameGeneration: 0,
            total: 0
        };
    },

    /**
     * Save credits used
     */
    saveCreditsUsed(credits) {
        return this.save('creditsUsed', credits);
    },

    /**
     * Add credits to existing total
     */
    addCredits(step, amount) {
        const credits = this.getCreditsUsed();
        credits[step] = (credits[step] || 0) + amount;
        credits.total = (credits.total || 0) + amount;
        this.saveCreditsUsed(credits);
        return credits;
    },

    /**
     * Get paragraphs
     */
    getParagraphs() {
        return this.load('paragraphs') || [];
    },

    /**
     * Save paragraphs
     */
    saveParagraphs(paragraphs) {
        return this.save('paragraphs', paragraphs);
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateManager;
}
