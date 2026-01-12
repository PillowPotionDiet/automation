/**
 * Background Script - Automation Handler
 * Handles automation requests from YouTube Story Generator via content script bridge
 */

console.log('[VEO Background] Automation handler initialized');

// Store automation state
let automationState = {
    isRunning: false,
    currentStep: 0,
    totalSteps: 0,
    characters: [],
    environments: [],
    generatedImages: []
};

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[VEO Background] Received message:', request.action);

    if (request.action === 'startAutomation') {
        handleStartAutomation(request, sender)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({ success: false, message: error.message }));
        return true; // Keep channel open for async response
    }

    if (request.action === 'cancelAutomation') {
        handleCancelAutomation();
        sendResponse({ success: true, message: 'Automation cancelled' });
    }

    if (request.action === 'getAutomationStatus') {
        sendResponse({
            success: true,
            isRunning: automationState.isRunning,
            currentStep: automationState.currentStep,
            totalSteps: automationState.totalSteps
        });
    }
});

/**
 * Handle automation start request
 */
async function handleStartAutomation(request, sender) {
    if (automationState.isRunning) {
        return {
            success: false,
            message: 'Automation already running'
        };
    }

    console.log('[VEO Background] Starting automation:', {
        characters: request.characters?.length,
        environments: request.environments?.length
    });

    // Initialize state
    automationState.isRunning = true;
    automationState.characters = request.characters || [];
    automationState.environments = request.environments || [];
    automationState.totalSteps = automationState.characters.length + automationState.environments.length;
    automationState.currentStep = 0;
    automationState.generatedImages = [];

    try {
        // Find or create Google Labs Flow tab
        const flowTab = await getOrCreateFlowTab();

        // Wait for tab to load
        await waitForTabLoad(flowTab.id);

        // Send initial progress
        sendProgressUpdate(sender.tab.id, 10, 'Opening Google Labs Flow...');

        // Execute automation steps
        await executeAutomation(sender.tab.id, flowTab.id);

        return {
            success: true,
            message: 'Automation started successfully'
        };

    } catch (error) {
        console.error('[VEO Background] Automation error:', error);
        automationState.isRunning = false;

        // Send error to web page
        chrome.tabs.sendMessage(sender.tab.id, {
            type: 'AUTOMATION_ERROR',
            error: error.message,
            step: automationState.currentStep
        });

        return {
            success: false,
            message: error.message
        };
    }
}

/**
 * Get or create Google Labs Flow tab
 */
async function getOrCreateFlowTab() {
    // Check if Flow tab already exists
    const tabs = await chrome.tabs.query({ url: '*://labs.google/*/flow*' });

    if (tabs.length > 0) {
        console.log('[VEO Background] Flow tab already exists:', tabs[0].id);
        // Focus existing tab
        await chrome.tabs.update(tabs[0].id, { active: true });
        return tabs[0];
    }

    // Create new tab
    console.log('[VEO Background] Creating new Flow tab');
    const newTab = await chrome.tabs.create({
        url: 'https://labs.google/fx/tools/flow',
        active: true
    });

    return newTab;
}

/**
 * Wait for tab to fully load
 */
function waitForTabLoad(tabId) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            reject(new Error('Tab load timeout'));
        }, 30000);

        function listener(updatedTabId, changeInfo) {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
                clearTimeout(timeout);
                chrome.tabs.onUpdated.removeListener(listener);
                console.log('[VEO Background] Tab loaded:', tabId);
                resolve();
            }
        }

        chrome.tabs.onUpdated.addListener(listener);
    });
}

/**
 * Execute automation steps
 */
async function executeAutomation(sourceTabId, flowTabId) {
    console.log('[VEO Background] Executing automation on tab:', flowTabId);

    // Step 1: Open side panel (20%)
    sendProgressUpdate(sourceTabId, 20, 'Opening VEO Automaton side panel...');
    await openSidePanel(flowTabId);
    await sleep(2000);

    // Step 2: Prepare prompts (30%)
    sendProgressUpdate(sourceTabId, 30, 'Preparing prompts...');
    const prompts = preparePrompts();
    console.log('[VEO Background] Prepared', prompts.length, 'prompts');

    // Step 3: Inject prompts into extension UI (40%)
    sendProgressUpdate(sourceTabId, 40, 'Populating prompts...');
    await injectPrompts(flowTabId, prompts);
    await sleep(1000);

    // Step 4: Configure settings (50%)
    sendProgressUpdate(sourceTabId, 50, 'Configuring extension settings...');
    await configureExtension(flowTabId);
    await sleep(1000);

    // Step 5: Start generation (60%)
    sendProgressUpdate(sourceTabId, 60, 'Starting image generation...');
    await startGeneration(flowTabId);

    // Step 6: Monitor progress (60-90%)
    sendProgressUpdate(sourceTabId, 65, 'Generating images...');
    await monitorGeneration(sourceTabId, flowTabId, prompts.length);

    // Step 7: Collect results (90-95%)
    sendProgressUpdate(sourceTabId, 90, 'Collecting generated images...');
    const images = await collectGeneratedImages(flowTabId);
    automationState.generatedImages = images;

    // Step 8: Send completion notification (100%)
    sendProgressUpdate(sourceTabId, 100, 'Automation complete!');

    chrome.tabs.sendMessage(sourceTabId, {
        type: 'AUTOMATION_COMPLETE',
        success: true,
        images: images,
        downloadPath: 'Check your Downloads folder'
    });

    // Cleanup
    automationState.isRunning = false;
    console.log('[VEO Background] Automation completed successfully');
}

/**
 * Open side panel
 */
async function openSidePanel(tabId) {
    try {
        await chrome.sidePanel.open({ tabId: tabId });
        console.log('[VEO Background] Side panel opened');
    } catch (error) {
        console.warn('[VEO Background] Could not open side panel programmatically:', error.message);
        // Side panel might already be open or needs manual interaction
    }
}

/**
 * Prepare prompts from characters and environments
 */
function preparePrompts() {
    const prompts = [];

    // Add character prompts
    for (const char of automationState.characters) {
        prompts.push({
            type: 'character',
            name: char.name,
            content: char.content || char.prompt || char.description || char.name
        });
    }

    // Add environment prompts
    for (const env of automationState.environments) {
        prompts.push({
            type: 'environment',
            name: env.name,
            content: env.content || env.prompt || env.description || env.name
        });
    }

    return prompts;
}

/**
 * Inject prompts into extension UI
 */
async function injectPrompts(tabId, prompts) {
    const promptText = prompts.map(p => p.content).join('\n\n');

    // Execute script in the context of the extension's side panel
    // NOTE: This requires the side panel to be open and accessible
    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: (text) => {
            // Try to find the prompt input in VEO Automaton side panel
            const promptInput = document.querySelector('textarea[placeholder*="prompt" i], textarea[id*="prompt" i], textarea');
            if (promptInput) {
                promptInput.value = text;
                promptInput.dispatchEvent(new Event('input', { bubbles: true }));
                console.log('[VEO Inject] Prompts injected:', text.length, 'characters');
            } else {
                console.warn('[VEO Inject] Could not find prompt input field');
            }
        },
        args: [promptText]
    });
}

/**
 * Configure extension settings
 */
async function configureExtension(tabId) {
    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            // Set concurrent prompts to 1
            const concurrentSelect = document.querySelector('select[id*="concurrent" i], select');
            if (concurrentSelect) {
                concurrentSelect.value = '1';
                concurrentSelect.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('[VEO Config] Concurrent prompts set to 1');
            }

            // Switch to "Text to Image" tab if needed
            const textToImageTab = document.querySelector('[data-tab="text-to-image"], [aria-label*="Text to Image" i]');
            if (textToImageTab) {
                textToImageTab.click();
                console.log('[VEO Config] Switched to Text to Image tab');
            }
        }
    });
}

/**
 * Start generation by clicking Run button
 */
async function startGeneration(tabId) {
    await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            // Find and click the Run button
            const runButton = document.querySelector('button[id*="run" i], button:has-text("Run"), button.run-btn');
            if (runButton) {
                runButton.click();
                console.log('[VEO Start] Run button clicked');
            } else {
                console.warn('[VEO Start] Could not find Run button');
            }
        }
    });
}

/**
 * Monitor generation progress
 */
async function monitorGeneration(sourceTabId, flowTabId, totalImages) {
    const checkInterval = 5000; // Check every 5 seconds
    const maxWaitTime = totalImages * 30000; // Max 30 seconds per image
    let elapsed = 0;

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            elapsed += checkInterval;

            // Calculate progress (60% to 90%)
            const progress = Math.min(90, 60 + (elapsed / maxWaitTime) * 30);
            const remainingTime = Math.ceil((maxWaitTime - elapsed) / 1000);

            sendProgressUpdate(
                sourceTabId,
                progress,
                `Generating ${totalImages} images... (~${remainingTime}s remaining)`
            );

            // Check if generation is complete
            const isComplete = await checkGenerationComplete(flowTabId);

            if (isComplete || elapsed >= maxWaitTime) {
                clearInterval(interval);
                console.log('[VEO Monitor] Generation complete');
                resolve();
            }
        }, checkInterval);
    });
}

/**
 * Check if generation is complete
 */
async function checkGenerationComplete(tabId) {
    const result = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            // Check for completion indicators in VEO Automaton UI
            const queueElement = document.querySelector('[id*="queue" i], [class*="queue" i]');
            if (queueElement) {
                const text = queueElement.textContent.toLowerCase();
                return text.includes('complete') || text.includes('done') || text.includes('finished');
            }
            return false;
        }
    });

    return result[0]?.result || false;
}

/**
 * Collect generated images
 */
async function collectGeneratedImages(tabId) {
    const result = await chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            // Try to extract image URLs from generated results
            const images = [];
            const imageElements = document.querySelectorAll('img[src*="generated"], img[alt*="generated" i], .result-image img');

            imageElements.forEach((img, index) => {
                images.push({
                    index: index,
                    url: img.src,
                    alt: img.alt || `Generated image ${index + 1}`
                });
            });

            console.log('[VEO Collect] Collected', images.length, 'images');
            return images;
        }
    });

    return result[0]?.result || [];
}

/**
 * Send progress update to source tab
 */
function sendProgressUpdate(tabId, percentage, status) {
    chrome.tabs.sendMessage(tabId, {
        type: 'AUTOMATION_PROGRESS',
        percentage: percentage,
        status: status,
        currentItem: automationState.currentStep,
        totalItems: automationState.totalSteps
    }).catch(err => {
        console.warn('[VEO Background] Could not send progress update:', err.message);
    });
}

/**
 * Handle automation cancel
 */
function handleCancelAutomation() {
    console.log('[VEO Background] Cancelling automation');
    automationState.isRunning = false;
    automationState.currentStep = 0;
}

/**
 * Utility: Sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('[VEO Background] Handler ready');
