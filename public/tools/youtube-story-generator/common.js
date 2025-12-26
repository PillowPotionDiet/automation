/**
 * COMMON UTILITIES
 * Shared functions used across all pages
 */

const Utils = {
    /**
     * Show error message
     */
    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.innerHTML = `
            <span class="toast-icon">❌</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    /**
     * Show success message
     */
    showSuccess(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
            <span class="toast-icon">✅</span>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Show loading spinner
     */
    showLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'loadingOverlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    /**
     * Hide loading spinner
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Navigate to another page
     */
    navigateTo(page) {
        window.location.href = page;
    },

    /**
     * Calculate total scenes
     */
    calculateTotalScenes(paragraphs, scenesPerParagraph) {
        return paragraphs * scenesPerParagraph;
    },

    /**
     * Calculate estimated API requests
     * Each scene = 2 images (start + end) + 1 video = 3 requests
     */
    calculateEstimatedRequests(totalScenes) {
        return totalScenes * 3;
    },

    /**
     * Split script into paragraphs
     */
    splitScriptIntoParagraphs(script, numParagraphs) {
        const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
        const sentencesPerParagraph = Math.ceil(sentences.length / numParagraphs);

        const paragraphs = [];
        for (let i = 0; i < numParagraphs; i++) {
            const start = i * sentencesPerParagraph;
            const end = start + sentencesPerParagraph;
            const paragraphText = sentences.slice(start, end).join(' ').trim();
            if (paragraphText) {
                paragraphs.push(paragraphText);
            }
        }

        return paragraphs;
    },

    /**
     * Generate scene prompts from paragraph
     */
    generateScenePrompts(paragraphText, sceneNumber, totalScenesInParagraph) {
        // Simple prompt generation - can be enhanced
        const basePrompt = paragraphText.substring(0, 200); // First 200 chars

        return {
            startingFrame: `Scene ${sceneNumber} beginning: ${basePrompt}`,
            endingFrame: `Scene ${sceneNumber} ending: ${basePrompt}`
        };
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Download file
     */
    async downloadFile(url, filename) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Download error:', error);
            Utils.showError('Download failed');
        }
    },

    /**
     * Create step indicator HTML
     * Updated for 6-step flow (Phase 2.5)
     */
    createStepIndicator(currentStep) {
        return `
            <div class="step-indicator">
                <div class="step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}">
                    <div class="step-number">1</div>
                    <div class="step-label">Script</div>
                </div>
                <div class="step-line ${currentStep > 1 ? 'completed' : ''}"></div>
                <div class="step ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}">
                    <div class="step-number">2</div>
                    <div class="step-label">Identities</div>
                </div>
                <div class="step-line ${currentStep > 2 ? 'completed' : ''}"></div>
                <div class="step ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}">
                    <div class="step-number">3</div>
                    <div class="step-label">Scenes</div>
                </div>
                <div class="step-line ${currentStep > 3 ? 'completed' : ''}"></div>
                <div class="step ${currentStep === 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}">
                    <div class="step-number">4</div>
                    <div class="step-label">Images</div>
                </div>
                <div class="step-line ${currentStep > 4 ? 'completed' : ''}"></div>
                <div class="step ${currentStep === 5 ? 'active' : ''} ${currentStep > 5 ? 'completed' : ''}">
                    <div class="step-number">5</div>
                    <div class="step-label">Videos</div>
                </div>
                <div class="step-line ${currentStep > 5 ? 'completed' : ''}"></div>
                <div class="step ${currentStep === 6 ? 'active' : ''} ${currentStep > 6 ? 'completed' : ''}">
                    <div class="step-number">6</div>
                    <div class="step-label">Final</div>
                </div>
            </div>
        `;
    }
};

/**
 * DUMMY DATA HELPER
 * Provides dummy data for testing pages directly via URL
 */
const DummyData = {
    // Placeholder image URLs (using simple placeholder service)
    placeholderImage: 'https://placehold.co/1920x1080/6366f1/ffffff?text=Sample+Image',
    placeholderVideo: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',

    /**
     * Get dummy script data
     */
    getScriptData() {
        return {
            script: `Once upon a time in a magical forest, there lived a young adventurer named Maya. She had bright blue eyes and long auburn hair that flowed in the wind. Maya discovered an ancient map hidden in her grandmother's attic.

The map led to a mysterious cave deep within the enchanted woods. Inside the cave, glowing crystals illuminated the darkness, revealing hidden treasures and ancient secrets. Maya felt both excited and nervous as she ventured deeper.

Finally, Maya reached the heart of the cave where a magnificent golden dragon awaited. The dragon was not fearsome but wise, offering Maya the greatest treasure of all - the knowledge of her true destiny.`,
            numParagraphs: 3,
            scenesPerParagraph: 2,
            totalScenes: 6
        };
    },

    /**
     * Get dummy extracted characters
     */
    getExtractedCharacters() {
        return [
            {
                name: 'Maya',
                content: 'A young adventurer with bright blue eyes and long auburn hair. She is curious, brave, and determined. Wearing a green explorer outfit with leather boots and a satchel.'
            },
            {
                name: 'Golden Dragon',
                content: 'A magnificent ancient dragon with shimmering golden scales. Wise and benevolent, with large amber eyes that glow with ancient knowledge.'
            }
        ];
    },

    /**
     * Get dummy extracted environments
     */
    getExtractedEnvironments() {
        return [
            {
                name: 'Magical Forest',
                content: 'An enchanted forest with towering ancient trees, glowing mushrooms, and floating fireflies. Soft sunlight filters through the canopy creating magical rays of light.'
            },
            {
                name: 'Crystal Cave',
                content: 'A mysterious underground cave filled with luminescent crystals of various colors. The crystals cast a magical glow on the ancient stone walls.'
            }
        ];
    },

    /**
     * Get dummy global state (locked identities)
     */
    getGlobalState() {
        return {
            characters: {
                'maya': {
                    name: 'Maya',
                    seed: 12345,
                    attributes: 'Young adventurer, bright blue eyes, long auburn hair, green explorer outfit, leather boots, satchel',
                    master_image_url: 'https://placehold.co/512x512/6366f1/ffffff?text=Maya',
                    locked: true
                },
                'golden_dragon': {
                    name: 'Golden Dragon',
                    seed: 67890,
                    attributes: 'Magnificent golden scales, large amber eyes, ancient and wise, glowing presence',
                    master_image_url: 'https://placehold.co/512x512/f59e0b/ffffff?text=Dragon',
                    locked: true
                }
            },
            environments: {
                'magical_forest': {
                    name: 'Magical Forest',
                    seed: 11111,
                    attributes: 'Enchanted forest, ancient trees, glowing mushrooms, floating fireflies, magical sunlight',
                    master_image_url: 'https://placehold.co/512x512/10b981/ffffff?text=Forest',
                    locked: true
                },
                'crystal_cave': {
                    name: 'Crystal Cave',
                    seed: 22222,
                    attributes: 'Underground cave, luminescent crystals, various colors, magical glow, ancient stone walls',
                    master_image_url: 'https://placehold.co/512x512/8b5cf6/ffffff?text=Cave',
                    locked: true
                }
            },
            locked: true
        };
    },

    /**
     * Get dummy scenes
     */
    getScenes() {
        return [
            {
                sceneNumber: 1,
                paragraphIndex: 1,
                paragraphText: 'Once upon a time in a magical forest, there lived a young adventurer named Maya. She had bright blue eyes and long auburn hair that flowed in the wind. Maya discovered an ancient map hidden in her grandmother\'s attic.',
                sceneText: 'Maya discovering the ancient map in the attic',
                startingFrame: 'Maya stands in a dusty attic, sunlight streaming through a window, holding an old rolled-up map. Her blue eyes sparkle with curiosity as she unrolls the parchment.',
                endingFrame: 'Close-up of Maya\'s excited face as she studies the detailed map, ancient symbols glowing faintly on the weathered paper.',
                description: 'Maya discovers the ancient map'
            },
            {
                sceneNumber: 2,
                paragraphIndex: 1,
                paragraphText: 'Once upon a time in a magical forest, there lived a young adventurer named Maya. She had bright blue eyes and long auburn hair that flowed in the wind. Maya discovered an ancient map hidden in her grandmother\'s attic.',
                sceneText: 'Maya beginning her journey into the forest',
                startingFrame: 'Maya stands at the edge of the magical forest, map in hand, looking up at the towering ancient trees with determination.',
                endingFrame: 'Maya walks deeper into the enchanted forest, fireflies beginning to light her path, her auburn hair flowing behind her.',
                description: 'Maya enters the magical forest'
            },
            {
                sceneNumber: 3,
                paragraphIndex: 2,
                paragraphText: 'The map led to a mysterious cave deep within the enchanted woods. Inside the cave, glowing crystals illuminated the darkness, revealing hidden treasures and ancient secrets. Maya felt both excited and nervous as she ventured deeper.',
                sceneText: 'Maya approaching the crystal cave entrance',
                startingFrame: 'Maya stands before a mysterious cave entrance covered in glowing vines, the map glowing in her hands pointing inside.',
                endingFrame: 'Maya steps cautiously into the cave entrance, colorful crystal lights beginning to illuminate her face from within.',
                description: 'Maya finds the cave entrance'
            },
            {
                sceneNumber: 4,
                paragraphIndex: 2,
                paragraphText: 'The map led to a mysterious cave deep within the enchanted woods. Inside the cave, glowing crystals illuminated the darkness, revealing hidden treasures and ancient secrets. Maya felt both excited and nervous as she ventured deeper.',
                sceneText: 'Maya exploring the crystal-filled cave interior',
                startingFrame: 'Maya walks through a tunnel of luminescent crystals in purple, blue, and green, her reflection shimmering in the crystal surfaces.',
                endingFrame: 'Maya reaches a large cavern filled with treasure and ancient artifacts, crystals casting rainbow light across the chamber.',
                description: 'Maya explores the crystal cave'
            },
            {
                sceneNumber: 5,
                paragraphIndex: 3,
                paragraphText: 'Finally, Maya reached the heart of the cave where a magnificent golden dragon awaited. The dragon was not fearsome but wise, offering Maya the greatest treasure of all - the knowledge of her true destiny.',
                sceneText: 'Maya encountering the golden dragon',
                startingFrame: 'Maya emerges into the heart of the cave, gasping as she sees the magnificent golden dragon sitting regally on a throne of crystals.',
                endingFrame: 'The golden dragon lowers its great head to meet Maya\'s gaze, its amber eyes glowing with ancient wisdom and kindness.',
                description: 'Maya meets the golden dragon'
            },
            {
                sceneNumber: 6,
                paragraphIndex: 3,
                paragraphText: 'Finally, Maya reached the heart of the cave where a magnificent golden dragon awaited. The dragon was not fearsome but wise, offering Maya the greatest treasure of all - the knowledge of her true destiny.',
                sceneText: 'The dragon revealing Maya\'s destiny',
                startingFrame: 'The golden dragon speaks to Maya, magical golden light emanating from its form, ancient runes floating in the air between them.',
                endingFrame: 'Maya stands transformed, glowing with newfound purpose, the dragon\'s wisdom now part of her being, ready to embrace her destiny.',
                description: 'Maya learns her true destiny'
            }
        ];
    },

    /**
     * Get dummy generated images
     */
    getGeneratedImages() {
        const images = {};
        for (let i = 1; i <= 6; i++) {
            images[`scene_${i}_start`] = {
                url: `https://placehold.co/1920x1080/6366f1/ffffff?text=Scene+${i}+Start`
            };
            images[`scene_${i}_end`] = {
                url: `https://placehold.co/1920x1080/8b5cf6/ffffff?text=Scene+${i}+End`
            };
        }
        return images;
    },

    /**
     * Get dummy generated videos
     */
    getGeneratedVideos() {
        const videos = {};
        for (let i = 1; i <= 6; i++) {
            videos[`scene_${i}`] = {
                url: this.placeholderVideo,
                thumbnail: `https://placehold.co/1920x1080/10b981/ffffff?text=Video+${i}+Thumbnail`
            };
        }
        return videos;
    },

    /**
     * Initialize dummy data for a specific page
     * Call this when a page is accessed directly without completing previous steps
     */
    initializeForPage(pageNumber) {
        // Always set API key and webhook for testing
        if (!StateManager.getApiKey()) {
            StateManager.saveApiKey('dummy_api_key_for_testing');
            StateManager.setWebhookConfigured(true);
        }

        // Save brain type
        StateManager.saveBrainType('storyboard');

        switch(pageNumber) {
            case 2:
                // Page 2 needs: script data, extracted characters/environments
                if (!StateManager.getScriptData()) {
                    StateManager.saveScriptData(this.getScriptData());
                }
                if (!StateManager.getExtractedCharacters().length) {
                    StateManager.saveExtractedCharacters(this.getExtractedCharacters());
                }
                if (!StateManager.getExtractedEnvironments().length) {
                    StateManager.saveExtractedEnvironments(this.getExtractedEnvironments());
                }
                StateManager.markPageCompleted(1);
                break;

            case 3:
                // Page 3 needs: all of above + global state (locked) + scenes
                this.initializeForPage(2);
                if (!StateManager.areIdentitiesLocked()) {
                    StateManager.saveGlobalState(this.getGlobalState());
                }
                if (!StateManager.getScenes().length) {
                    StateManager.saveScenes(this.getScenes());
                }
                StateManager.markPageCompleted(2);
                break;

            case 4:
                // Page 4 needs: all of above + completed page 3
                this.initializeForPage(3);
                StateManager.markPageCompleted(3);
                break;

            case 5:
                // Page 5 needs: all of above + generated images
                this.initializeForPage(4);
                if (Object.keys(StateManager.getGeneratedImages()).length === 0) {
                    StateManager.saveGeneratedImages(this.getGeneratedImages());
                }
                StateManager.markPageCompleted(4);
                break;

            case 6:
                // Page 6 needs: all of above + generated videos
                this.initializeForPage(5);
                if (Object.keys(StateManager.getGeneratedVideos()).length === 0) {
                    StateManager.saveGeneratedVideos(this.getGeneratedVideos());
                }
                StateManager.markPageCompleted(5);
                break;
        }

        console.log(`[DummyData] Initialized dummy data for page ${pageNumber}`);
        return true;
    },

    /**
     * Check if page can proceed with current data, or needs dummy data
     */
    ensureDataForPage(pageNumber) {
        // Check if we have the required data for this page
        const hasRequiredData = StateManager.hasCompletedPage(pageNumber - 1);

        if (!hasRequiredData) {
            console.log(`[DummyData] Page ${pageNumber} missing required data, initializing dummy data...`);
            this.initializeForPage(pageNumber);
            return true; // Data was initialized
        }

        return false; // Data already exists
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils, DummyData };
}
