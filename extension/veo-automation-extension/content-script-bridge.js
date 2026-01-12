/**
 * Content Script Bridge
 * Enables communication between YouTube Story Generator web page and VEO Automaton Extension
 */

console.log('[VEO Bridge] Content script bridge loaded');

// Listen for messages from the web page (YouTube Story Generator)
window.addEventListener('message', async (event) => {
    // Only accept messages from trusted origins
    const trustedOrigins = [
        'https://automation.pillowpotion.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500', // Live Server
        'http://127.0.0.1:5500'
    ];

    // Check if message is from trusted origin
    const isTrusted = trustedOrigins.some(origin => event.origin.startsWith(origin)) ||
                     window.location.protocol === 'file:'; // Allow file:// for local testing

    if (!isTrusted) {
        console.log('[VEO Bridge] Rejected message from untrusted origin:', event.origin);
        return;
    }

    const data = event.data;

    // Extension availability check
    if (data.type === 'EXTENSION_CHECK') {
        console.log('[VEO Bridge] Extension check received');
        window.postMessage({
            type: 'EXTENSION_AVAILABLE',
            version: chrome.runtime.getManifest().version
        }, '*');
        return;
    }

    // Start automation request
    if (data.type === 'START_AUTOMATION') {
        console.log('[VEO Bridge] Automation request received:', {
            characters: data.characters?.length,
            environments: data.environments?.length
        });

        try {
            // Forward to background script
            const response = await chrome.runtime.sendMessage({
                action: 'startAutomation',
                characters: data.characters,
                environments: data.environments,
                sourceOrigin: event.origin
            });

            console.log('[VEO Bridge] Background script response:', response);

            // Send confirmation back to web page
            window.postMessage({
                type: 'AUTOMATION_STARTED',
                success: response.success,
                message: response.message
            }, '*');

        } catch (error) {
            console.error('[VEO Bridge] Error forwarding to background:', error);
            window.postMessage({
                type: 'AUTOMATION_ERROR',
                error: error.message
            }, '*');
        }
    }
});

// Listen for messages from background script (progress updates)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[VEO Bridge] Message from background:', message.type);

    // Forward progress updates to web page
    if (message.type === 'AUTOMATION_PROGRESS') {
        window.postMessage({
            type: 'AUTOMATION_PROGRESS',
            percentage: message.percentage,
            status: message.status,
            currentItem: message.currentItem,
            totalItems: message.totalItems
        }, '*');
    }

    // Forward completion notification
    if (message.type === 'AUTOMATION_COMPLETE') {
        window.postMessage({
            type: 'AUTOMATION_COMPLETE',
            success: message.success,
            images: message.images,
            downloadPath: message.downloadPath
        }, '*');
    }

    // Forward error notification
    if (message.type === 'AUTOMATION_ERROR') {
        window.postMessage({
            type: 'AUTOMATION_ERROR',
            error: message.error,
            step: message.step
        }, '*');
    }

    sendResponse({ received: true });
    return true; // Keep channel open for async response
});

console.log('[VEO Bridge] Bridge initialized and listening for messages');
