/**
 * Google Labs Flow Automator
 * Automates character and environment image generation using Google Labs Flow + VEO Automaton Extension
 * Version 2.0 - FULL AUTOMATION (No manual user actions required)
 */

class GoogleLabsFlowAutomator {
    constructor() {
        this.progressCallback = null;
        this.characters = [];
        this.environments = [];
        this.generatedImages = [];
        this.isAutomating = false;
        this.extensionAvailable = false;

        // Setup message listener for extension responses
        this.setupMessageListener();
    }

    /**
     * Setup listener for messages from VEO Automaton extension
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            // Only accept messages from same origin (extension content script)
            if (event.source !== window) return;

            const data = event.data;

            console.log('[Automator] Received message:', data.type);

            switch (data.type) {
                case 'EXTENSION_AVAILABLE':
                    this.extensionAvailable = true;
                    this.extensionVersion = data.version;
                    console.log('[Automator] VEO Automaton extension detected:', data.version);
                    break;

                case 'AUTOMATION_STARTED':
                    console.log('[Automator] Extension confirmed automation start:', data.message);
                    break;

                case 'AUTOMATION_PROGRESS':
                    this.handleProgressUpdate(data);
                    break;

                case 'AUTOMATION_COMPLETE':
                    this.handleAutomationComplete(data);
                    break;

                case 'AUTOMATION_ERROR':
                    this.handleAutomationError(data);
                    break;
            }
        });
    }

    /**
     * Check if VEO Automaton extension is installed and available
     */
    async checkExtension() {
        return new Promise((resolve) => {
            // Send check message
            window.postMessage({ type: 'EXTENSION_CHECK' }, '*');

            // Wait for response
            const timeout = setTimeout(() => {
                console.warn('[Automator] Extension not detected');
                resolve(false);
            }, 2000);

            // Listen for response
            const checkInterval = setInterval(() => {
                if (this.extensionAvailable) {
                    clearTimeout(timeout);
                    clearInterval(checkInterval);
                    resolve(true);
                }
            }, 100);
        });
    }

    /**
     * Main automation entry point - FULLY AUTOMATED
     */
    async startAutomation(characters, environments, progressCallback) {
        this.characters = characters;
        this.environments = environments;
        this.progressCallback = progressCallback;
        this.isAutomating = true;

        try {
            console.log('[Automator] Starting FULL automation with', characters.length, 'characters and', environments.length, 'environments');

            // Step 1: Check extension availability (5%)
            this.updateProgress(5, 'Checking VEO Automaton extension...');
            const extensionFound = await this.checkExtension();

            if (!extensionFound) {
                throw new Error('VEO Automaton extension not found. Please install and enable it first.');
            }

            console.log('[Automator] ✓ Extension detected');

            // Step 2: Prepare data (10%)
            this.updateProgress(10, 'Preparing character and environment data...');
            const automationData = this.prepareAutomationData();
            console.log('[Automator] ✓ Prepared', automationData.characters.length + automationData.environments.length, 'items');

            // Step 3: Send automation request to extension (15%)
            this.updateProgress(15, 'Sending automation request to extension...');
            await this.sendAutomationRequest(automationData);

            console.log('[Automator] ✓ Automation request sent to extension');
            console.log('[Automator] Extension is now handling everything automatically...');

            // From here, the extension takes over and sends progress updates
            // We just wait for completion or error messages

            return {
                success: true,
                message: 'Automation started successfully. Extension is now processing...'
            };

        } catch (error) {
            console.error('[Automator] Error:', error);
            this.isAutomating = false;
            this.updateProgress(0, 'Error: ' + error.message);

            if (typeof Utils !== 'undefined' && Utils.showError) {
                Utils.showError(error.message);
            }

            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Prepare automation data for extension
     */
    prepareAutomationData() {
        return {
            characters: this.characters.map(char => ({
                type: 'character',
                name: char.name,
                content: char.content || char.prompt || char.description || char.name,
                attributes: char.attributes || {}
            })),
            environments: this.environments.map(env => ({
                type: 'environment',
                name: env.name,
                content: env.content || env.prompt || env.description || env.name,
                attributes: env.attributes || {}
            }))
        };
    }

    /**
     * Send automation request to VEO Automaton extension
     */
    async sendAutomationRequest(data) {
        // Send message to extension via content script bridge
        window.postMessage({
            type: 'START_AUTOMATION',
            characters: data.characters,
            environments: data.environments
        }, '*');

        // Wait a moment for confirmation
        await this.sleep(1000);
    }

    /**
     * Handle progress update from extension
     */
    handleProgressUpdate(data) {
        console.log(`[Automator] Progress: ${data.percentage}% - ${data.status}`);
        this.updateProgress(data.percentage, data.status);

        // Update UI with current item info if available
        if (data.currentItem && data.totalItems) {
            const itemInfo = ` (${data.currentItem}/${data.totalItems})`;
            this.updateProgress(data.percentage, data.status + itemInfo);
        }
    }

    /**
     * Handle automation completion from extension
     */
    async handleAutomationComplete(data) {
        console.log('[Automator] ✓ Automation complete!', data);

        this.isAutomating = false;
        this.generatedImages = data.images || [];

        this.updateProgress(100, 'All images generated successfully!');

        if (typeof Utils !== 'undefined' && Utils.showSuccess) {
            Utils.showSuccess(`Generated ${this.generatedImages.length} images successfully!`);
        }

        // Store metadata and navigate to page 2
        await this.navigateToPage2();
    }

    /**
     * Handle automation error from extension
     */
    handleAutomationError(data) {
        console.error('[Automator] Error from extension:', data.error);

        this.isAutomating = false;
        this.updateProgress(0, 'Error: ' + data.error);

        if (typeof Utils !== 'undefined' && Utils.showError) {
            Utils.showError('Automation failed: ' + data.error);
        }
    }

    /**
     * Navigate to page 2 with generated images metadata
     */
    async navigateToPage2() {
        console.log('[Automator] Navigating to page 2...');

        // Store metadata in session storage
        sessionStorage.setItem('generatedImagesMetadata', JSON.stringify(this.generatedImages));
        sessionStorage.setItem('automationCompleted', 'true');
        sessionStorage.setItem('automationTimestamp', Date.now().toString());

        // Navigate to page 2 after a brief delay
        setTimeout(() => {
            window.location.href = 'page2.html';
        }, 2000);
    }

    /**
     * Utility: Sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
