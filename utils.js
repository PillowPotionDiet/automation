/**
 * UTILITY FUNCTIONS
 * Helper functions for the Script-to-Video Generator
 */

// ========== Toast Notifications ==========

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds (default 5000)
 */
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <span class="toast-close">×</span>
    `;

    container.appendChild(toast);

    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

/**
 * Show success toast
 */
function showSuccess(message, duration = 5000) {
    showToast(message, 'success', duration);
}

/**
 * Show error toast
 */
function showError(message, duration = 7000) {
    showToast(message, 'error', duration);
}

/**
 * Show warning toast
 */
function showWarning(message, duration = 6000) {
    showToast(message, 'warning', duration);
}

/**
 * Show info toast
 */
function showInfo(message, duration = 5000) {
    showToast(message, 'info', duration);
}

// ========== Time Formatting ==========

/**
 * Format seconds to MM:SS
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
}

/**
 * Get current timestamp in HH:MM:SS format
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

// ========== String Utilities ==========

/**
 * Split script into paragraphs
 * @param {string} script - The script text
 * @param {number} targetParagraphs - Target number of paragraphs
 * @returns {string[]} Array of paragraphs
 */
function splitIntoParagraphs(script, targetParagraphs) {
    // First try splitting by double line breaks
    let paragraphs = script.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    // If we don't have enough paragraphs, split by single line breaks
    if (paragraphs.length < targetParagraphs) {
        paragraphs = script.split(/\n/).filter(p => p.trim().length > 0);
    }

    // If we still don't have enough, split by sentences
    if (paragraphs.length < targetParagraphs) {
        paragraphs = script.match(/[^.!?]+[.!?]+/g) || [script];
    }

    // Group paragraphs to match target count
    if (paragraphs.length > targetParagraphs) {
        const groupSize = Math.ceil(paragraphs.length / targetParagraphs);
        const grouped = [];
        for (let i = 0; i < paragraphs.length; i += groupSize) {
            grouped.push(paragraphs.slice(i, i + groupSize).join('\n\n'));
        }
        paragraphs = grouped;
    }

    // Ensure we don't exceed target
    return paragraphs.slice(0, targetParagraphs);
}

/**
 * Split paragraph into scenes
 * @param {string} paragraph - The paragraph text
 * @param {number} targetScenes - Target number of scenes
 * @returns {string[]} Array of scenes
 */
function splitIntoScenes(paragraph, targetScenes) {
    // Split by sentences
    const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];

    if (sentences.length <= targetScenes) {
        return sentences.map(s => s.trim());
    }

    // Group sentences to match target scene count
    const groupSize = Math.ceil(sentences.length / targetScenes);
    const scenes = [];

    for (let i = 0; i < sentences.length; i += groupSize) {
        scenes.push(sentences.slice(i, i + groupSize).join(' ').trim());
    }

    return scenes.slice(0, targetScenes);
}

/**
 * Generate frame prompts from scene text
 * @param {string} sceneText - The scene description
 * @returns {Object} Object with start and end prompts
 */
function generateFramePrompts(sceneText) {
    const basePrompt = sceneText.trim();

    return {
        start: `${basePrompt} - opening shot, cinematic wide angle, establishing scene`,
        end: `${basePrompt} - closing shot, cinematic composition, transition ready`
    };
}

/**
 * Truncate text to max length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// ========== DOM Utilities ==========

/**
 * Show element
 * @param {string|HTMLElement} element - Element or selector
 */
function show(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.classList.remove('hidden');
}

/**
 * Hide element
 * @param {string|HTMLElement} element - Element or selector
 */
function hide(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.classList.add('hidden');
}

/**
 * Toggle element visibility
 * @param {string|HTMLElement} element - Element or selector
 */
function toggle(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.classList.toggle('hidden');
}

/**
 * Clear element content
 * @param {string|HTMLElement} element - Element or selector
 */
function clearElement(element) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (el) el.innerHTML = '';
}

// ========== Data Storage ==========

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} data - Data to store
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Stored data or default value
 */
function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

// ========== File Utilities ==========

/**
 * Convert File to base64
 * @param {File} file - File object
 * @returns {Promise<string>} Base64 string
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Download data as file
 * @param {string} data - Data to download
 * @param {string} filename - Filename
 * @param {string} type - MIME type
 */
function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Download URL as file
 * @param {string} url - URL to download
 * @param {string} filename - Filename
 */
async function downloadFromURL(url, filename) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Error downloading file:', error);
        showError('Failed to download file');
    }
}

// ========== Array Utilities ==========

/**
 * Sleep/wait for specified milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of function
 */
async function retry(fn, maxAttempts = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) {
                throw error;
            }

            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array[]} Array of chunks
 */
function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

// ========== Validation ==========

/**
 * Validate API key format
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid
 */
function validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') return false;
    if (apiKey.trim().length < 10) return false;
    return true;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid
 */
function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// ========== Number Utilities ==========

/**
 * Clamp number between min and max
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
function percentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

// ========== Error Messages ==========

const ERROR_MESSAGES = {
    API_KEY_REQUIRED: '⚠️ API key required. Please enter your GeminiGen.ai API key.',
    INVALID_API_KEY: '❌ Invalid API key. Please check and try again.',
    RATE_LIMIT_MINUTE: '⏱️ Rate limit exceeded (20/min). Waiting...',
    RATE_LIMIT_HOUR: '⏱️ Hourly limit reached (200/hour). Please wait or try later.',
    RATE_LIMIT_DAY: '⏱️ Daily limit reached (2000/day). Service will reset tomorrow.',
    QUOTA_EXCEEDED: '🚫 Quota exceeded. You\'ve used all 3000 requests. Please renew your API Max subscription.',
    IMAGE_GENERATION_FAILED: '❌ Image generation failed. Retrying',
    VIDEO_GENERATION_FAILED: '❌ Video generation failed. Retrying',
    NETWORK_ERROR: '🌐 Network error. Please check your connection.',
    GENERATION_FAILED_FINAL: '❌ Generation failed after 3 attempts. Please try regenerating manually.',
    ENV_LOCK_NO_DESCRIPTION: '⚠️ Environment Lock enabled but no description provided.',
    CHAR_LOCK_NO_DESCRIPTION: '⚠️ Character Lock enabled but no description provided.',
    SCRIPT_EMPTY: '⚠️ Please enter a script before generating.',
    CONNECTION_FAILED: '❌ Connection test failed. Please check your API key.',
    CONNECTION_SUCCESS: '✅ Successfully connected to GeminiGen.ai API!'
};

/**
 * Get error message by key
 * @param {string} key - Error message key
 * @returns {string} Error message
 */
function getErrorMessage(key) {
    return ERROR_MESSAGES[key] || 'An error occurred';
}

// ========== Export for module systems (optional) ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        formatTime,
        getTimestamp,
        splitIntoParagraphs,
        splitIntoScenes,
        generateFramePrompts,
        truncate,
        show,
        hide,
        toggle,
        clearElement,
        saveToStorage,
        loadFromStorage,
        removeFromStorage,
        fileToBase64,
        downloadFile,
        downloadFromURL,
        sleep,
        retry,
        chunk,
        validateApiKey,
        validateURL,
        clamp,
        percentage,
        getErrorMessage,
        ERROR_MESSAGES
    };
}
