/**
 * Side Panel Auto-Runner
 * This script runs in the VEO Automaton side panel context
 * It listens for automation data and automatically executes when detected
 */

console.log('[VEO Auto-Runner] Side panel auto-runner initialized');

// Listen for automation data in chrome.storage
chrome.storage.local.get(['veoAutomationData'], async (result) => {
    if (result.veoAutomationData && result.veoAutomationData.autoStart) {
        console.log('[VEO Auto-Runner] Found automation data:', result.veoAutomationData);

        const { prompts, sourceTabId, flowTabId } = result.veoAutomationData;

        // Clear the autoStart flag so we don't run again
        await chrome.storage.local.set({
            veoAutomationData: {
                ...result.veoAutomationData,
                autoStart: false
            }
        });

        // Start automation
        await startAutomation(prompts, sourceTabId);
    }
});

// Also listen for storage changes (in case data is added after panel opens)
chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'local' && changes.veoAutomationData) {
        const newData = changes.veoAutomationData.newValue;

        if (newData && newData.autoStart) {
            console.log('[VEO Auto-Runner] Detected new automation data:', newData);

            const { prompts, sourceTabId } = newData;

            // Clear the autoStart flag
            await chrome.storage.local.set({
                veoAutomationData: {
                    ...newData,
                    autoStart: false
                }
            });

            // Start automation
            await startAutomation(prompts, sourceTabId);
        }
    }
});

/**
 * Start automation with prompts
 */
async function startAutomation(prompts, sourceTabId) {
    console.log('[VEO Auto-Runner] Starting automation with', prompts.length, 'prompts');

    try {
        // Step 1: Find the prompt textarea
        await waitForElement('textarea');

        // Step 2: Populate prompts
        const promptText = prompts.map(p => p.content).join('\n\n');
        const textarea = document.querySelector('textarea');

        if (!textarea) {
            throw new Error('Could not find prompt textarea');
        }

        textarea.value = promptText;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));

        console.log('[VEO Auto-Runner] Prompts populated');

        // Send progress update
        sendProgressToSourceTab(sourceTabId, 70, 'Prompts populated in VEO Automaton');

        await sleep(1000);

        // Step 3: Set concurrent prompts to 1
        const concurrentSelect = document.querySelector('select[id*="concurrent" i], select');
        if (concurrentSelect) {
            concurrentSelect.value = '1';
            concurrentSelect.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('[VEO Auto-Runner] Set concurrent to 1');
        }

        await sleep(500);

        // Step 4: Switch to Text to Image tab if needed
        const tabs = document.querySelectorAll('[role="tab"], button[aria-selected]');
        for (const tab of tabs) {
            if (tab.textContent.toLowerCase().includes('text') && tab.textContent.toLowerCase().includes('image')) {
                tab.click();
                console.log('[VEO Auto-Runner] Switched to Text to Image tab');
                break;
            }
        }

        sendProgressToSourceTab(sourceTabId, 80, 'Settings configured');

        await sleep(1000);

        // Step 5: Find and click Run button
        const runButtons = document.querySelectorAll('button');
        for (const button of runButtons) {
            const text = button.textContent.toLowerCase();
            if (text.includes('run') || text.includes('generate') || text.includes('start')) {
                button.click();
                console.log('[VEO Auto-Runner] Clicked Run button');
                sendProgressToSourceTab(sourceTabId, 90, 'Generation started! Processing...');

                // Monitor completion
                await monitorCompletion(sourceTabId);
                return;
            }
        }

        throw new Error('Could not find Run button');

    } catch (error) {
        console.error('[VEO Auto-Runner] Error:', error);
        sendErrorToSourceTab(sourceTabId, error.message);
    }
}

/**
 * Monitor generation completion
 */
async function monitorCompletion(sourceTabId) {
    console.log('[VEO Auto-Runner] Monitoring completion...');

    let checks = 0;
    const maxChecks = 60; // 5 minutes max

    const checkInterval = setInterval(async () => {
        checks++;

        // Check for completion indicators
        const queueElements = document.querySelectorAll('[class*="queue" i], [id*="queue" i]');
        let allComplete = false;

        for (const el of queueElements) {
            const text = el.textContent.toLowerCase();
            if (text.includes('complete') || text.includes('done') || text.includes('finished')) {
                allComplete = true;
                break;
            }
        }

        if (allComplete || checks >= maxChecks) {
            clearInterval(checkInterval);

            if (allComplete) {
                console.log('[VEO Auto-Runner] Generation complete!');
                sendCompletionToSourceTab(sourceTabId);
            } else {
                console.log('[VEO Auto-Runner] Timeout reached');
                sendProgressToSourceTab(sourceTabId, 95, 'Generation may still be processing. Check the Downloads folder.');
            }
        }
    }, 5000); // Check every 5 seconds
}

/**
 * Send progress update to source tab
 */
function sendProgressToSourceTab(tabId, percentage, status) {
    chrome.tabs.sendMessage(tabId, {
        type: 'AUTOMATION_PROGRESS',
        percentage: percentage,
        status: status
    }).catch(err => {
        console.warn('[VEO Auto-Runner] Could not send progress:', err.message);
    });
}

/**
 * Send completion to source tab
 */
function sendCompletionToSourceTab(tabId) {
    chrome.tabs.sendMessage(tabId, {
        type: 'AUTOMATION_COMPLETE',
        success: true,
        images: [],
        downloadPath: 'Check your Downloads folder'
    }).catch(err => {
        console.warn('[VEO Auto-Runner] Could not send completion:', err.message);
    });
}

/**
 * Send error to source tab
 */
function sendErrorToSourceTab(tabId, error) {
    chrome.tabs.sendMessage(tabId, {
        type: 'AUTOMATION_ERROR',
        error: error
    }).catch(err => {
        console.warn('[VEO Auto-Runner] Could not send error:', err.message);
    });
}

/**
 * Wait for element to appear
 */
function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
        if (el) {
            resolve(el);
            return;
        }

        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        const timeoutId = setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for element: ${selector}`));
        }, timeout);
    });
}

/**
 * Sleep utility
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('[VEO Auto-Runner] Ready to receive automation data');
