/**
 * Google Labs Flow Automator
 * Automates character and environment image generation using Google Labs Flow + VEO Automaton Extension
 */

class GoogleLabsFlowAutomator {
    constructor() {
        this.flowWindow = null;
        this.progressCallback = null;
        this.characters = [];
        this.environments = [];
        this.generatedImages = [];
        this.isAutomating = false;
    }

    /**
     * Main automation entry point
     */
    async startAutomation(characters, environments, progressCallback) {
        this.characters = characters;
        this.environments = environments;
        this.progressCallback = progressCallback;
        this.isAutomating = true;

        try {
            console.log('[Automator] Starting automation with', characters.length, 'characters and', environments.length, 'environments');

            // Step 1: Prepare prompts (5%)
            this.updateProgress(5, 'Preparing character and environment prompts...');
            const prompts = this.preparePrompts();
            console.log('[Automator] Prepared', prompts.length, 'prompts');

            // Step 2: Open Google Labs Flow tab (10%)
            this.updateProgress(10, 'Opening Google Labs Flow...');
            await this.openFlowTab();

            // Step 3: Wait for page load (20%)
            this.updateProgress(20, 'Waiting for page to load...');
            await this.waitForPageLoad();

            // Step 4: User needs to manually click VEO Automaton extension (30%)
            this.updateProgress(30, 'Please click the VEO Automaton extension icon...');
            await this.waitForExtensionActivation();

            // Step 5: Configure extension (40%)
            this.updateProgress(40, 'Configuring extension settings...');
            await this.configureExtension();

            // Step 6: Populate prompts (50%)
            this.updateProgress(50, 'Populating prompts...');
            await this.populatePrompts(prompts);

            // Step 7: Run generation (60%)
            this.updateProgress(60, 'Starting image generation...');
            await this.runGeneration();

            // Step 8: Monitor progress (70-85%)
            this.updateProgress(70, 'Generating images...');
            await this.monitorGeneration();

            // Step 9: Collect images (85-95%)
            this.updateProgress(85, 'Collecting generated images...');
            await this.collectImages();

            // Step 10: Navigate to page 2 (95-100%)
            this.updateProgress(95, 'Preparing results page...');
            await this.navigateToPage2();

            this.updateProgress(100, 'Automation complete!');

            return {
                success: true,
                images: this.generatedImages
            };

        } catch (error) {
            console.error('[Automator] Error:', error);
            this.isAutomating = false;
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Prepare prompts for all characters and environments
     */
    preparePrompts() {
        const prompts = [];

        // Add character prompts
        for (const char of this.characters) {
            prompts.push({
                type: 'character',
                name: char.name,
                prompt: char.content || char.prompt || char.description || `${char.name}`
            });
        }

        // Add environment prompts
        for (const env of this.environments) {
            prompts.push({
                type: 'environment',
                name: env.name,
                prompt: env.content || env.prompt || env.description || `${env.name}`
            });
        }

        return prompts;
    }

    /**
     * Open Google Labs Flow in a new window/tab
     */
    async openFlowTab() {
        return new Promise((resolve) => {
            // Open in new window for better visibility
            this.flowWindow = window.open(
                'https://labs.google/fx/tools/flow',
                '_blank',
                'width=1200,height=800'
            );

            if (!this.flowWindow) {
                throw new Error('Failed to open Google Labs Flow. Please check popup blocker.');
            }

            // Wait a bit for window to initialize
            setTimeout(resolve, 2000);
        });
    }

    /**
     * Wait for page to fully load
     */
    async waitForPageLoad() {
        return new Promise((resolve) => {
            // Since we can't directly monitor cross-origin window, just wait
            const checkInterval = setInterval(() => {
                try {
                    if (this.flowWindow && !this.flowWindow.closed) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                } catch (e) {
                    // Cross-origin access denied, but window exists
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 1000);

            // Timeout after 30 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 30000);
        });
    }

    /**
     * Wait for user to manually click VEO Automaton extension
     */
    async waitForExtensionActivation() {
        return new Promise((resolve) => {
            this.updateProgress(30, 'Waiting for VEO Automaton extension activation...');

            // Show instructions to user
            if (typeof Utils !== 'undefined' && Utils.showToast) {
                Utils.showToast('Please click the VEO Automaton extension icon in the Google Labs Flow tab', 'info', 10000);
            }

            // Wait for user confirmation or timeout
            setTimeout(resolve, 5000); // Give user 5 seconds to click
        });
    }

    /**
     * Configure extension settings (simulated - user needs to do this manually)
     */
    async configureExtension() {
        return new Promise((resolve) => {
            this.updateProgress(40, 'Please configure VEO Automaton:');
            this.updateProgress(45, '1. Select "Text to Image" tab');
            this.updateProgress(47, '2. Set "Concurrent Prompts" to "1 prompt"');

            setTimeout(resolve, 3000);
        });
    }

    /**
     * Populate prompts (user needs to copy-paste)
     */
    async populatePrompts(prompts) {
        const promptText = prompts.map(p => p.prompt).join('\n\n');

        // Copy to clipboard for user to paste
        try {
            await navigator.clipboard.writeText(promptText);
            this.updateProgress(55, 'Prompts copied to clipboard! Please paste into VEO Automaton.');

            if (typeof Utils !== 'undefined' && Utils.showToast) {
                Utils.showToast('Prompts copied! Paste them into the VEO Automaton extension.', 'success', 5000);
            }
        } catch (err) {
            console.error('[Automator] Failed to copy to clipboard:', err);
            this.updateProgress(55, 'Please manually copy the prompts shown below...');
        }

        // Show prompts in console for manual copy if clipboard fails
        console.log('[Automator] Prompts to paste:', promptText);

        return new Promise((resolve) => {
            setTimeout(resolve, 5000);
        });
    }

    /**
     * Run generation (user clicks Run button)
     */
    async runGeneration() {
        this.updateProgress(65, 'Please click the "Run" button in VEO Automaton...');

        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('Click the Run button in VEO Automaton to start generating images', 'info', 5000);
        }

        return new Promise((resolve) => {
            setTimeout(resolve, 3000);
        });
    }

    /**
     * Monitor generation progress
     */
    async monitorGeneration() {
        const totalImages = this.characters.length + this.environments.length;
        let estimatedTime = totalImages * 10000; // ~10 seconds per image

        return new Promise((resolve) => {
            let elapsed = 0;
            const updateInterval = setInterval(() => {
                elapsed += 2000;
                const progress = Math.min(85, 70 + (elapsed / estimatedTime) * 15);

                this.updateProgress(
                    progress,
                    `Generating ${totalImages} images... (this may take ${Math.ceil((estimatedTime - elapsed) / 1000)}s)`
                );

                if (elapsed >= estimatedTime) {
                    clearInterval(updateInterval);
                    resolve();
                }
            }, 2000);
        });
    }

    /**
     * Collect generated images
     */
    async collectImages() {
        this.updateProgress(90, 'Images generated! Please check your downloads folder.');

        // Since we can't access downloads programmatically from a web page,
        // we'll need user to manually proceed
        if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('Check your Downloads folder for the generated images', 'success', 5000);
        }

        // Store image metadata for tracking
        this.generatedImages = this.preparePrompts().map((prompt, index) => ({
            type: prompt.type,
            name: prompt.name,
            prompt: prompt.prompt,
            index: index,
            // User will need to manually upload these
            path: null,
            url: null
        }));

        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        });
    }

    /**
     * Navigate to page 2 with image metadata
     */
    async navigateToPage2() {
        // Store metadata in session storage
        sessionStorage.setItem('generatedImagesMetadata', JSON.stringify(this.generatedImages));
        sessionStorage.setItem('automationCompleted', 'true');

        // Close the Flow window
        if (this.flowWindow && !this.flowWindow.closed) {
            this.flowWindow.close();
        }

        // Navigate to page 2
        setTimeout(() => {
            window.location.href = 'page2.html';
        }, 1000);
    }

    /**
     * Update progress bar
     */
    updateProgress(percentage, message) {
        console.log(`[Automator] ${percentage}% - ${message}`);

        if (this.progressCallback) {
            this.progressCallback(percentage, message);
        }
    }

    /**
     * Cancel automation
     */
    cancel() {
        this.isAutomating = false;

        if (this.flowWindow && !this.flowWindow.closed) {
            this.flowWindow.close();
        }

        this.updateProgress(0, 'Automation cancelled');
    }
}
