/**
 * PROCESSING TIMEOUT UTILITY
 * Prevents processing from running indefinitely
 * Provides timeout protection for long-running operations
 */

class ProcessingTimeout {
    /**
     * Create a processing timeout
     * @param {number} maxDuration - Maximum duration in milliseconds (default: 2 minutes)
     */
    constructor(maxDuration = 120000) {
        this.maxDuration = maxDuration;
        this.startTime = null;
        this.timeoutId = null;
    }

    /**
     * Start the timeout
     * @param {function} onTimeout - Callback function to call when timeout occurs
     */
    start(onTimeout) {
        this.startTime = Date.now();
        this.timeoutId = setTimeout(() => {
            if (onTimeout) {
                onTimeout({
                    type: 'timeout',
                    elapsed: this.getElapsedTime(),
                    message: 'Processing took too long. Please try with a shorter script or reduce the number of paragraphs/scenes.'
                });
            }
        }, this.maxDuration);
    }

    /**
     * Clear the timeout
     */
    clear() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    /**
     * Get elapsed time since start
     * @returns {number} Elapsed time in milliseconds
     */
    getElapsedTime() {
        return this.startTime ? Date.now() - this.startTime : 0;
    }

    /**
     * Get remaining time
     * @returns {number} Remaining time in milliseconds
     */
    getRemainingTime() {
        if (!this.startTime) return this.maxDuration;
        const elapsed = this.getElapsedTime();
        return Math.max(0, this.maxDuration - elapsed);
    }

    /**
     * Get estimated time remaining as formatted string
     * @returns {string} Formatted time string (e.g., "1 minute 30 seconds")
     */
    getFormattedRemainingTime() {
        const remaining = this.getRemainingTime();
        const seconds = Math.floor((remaining / 1000) % 60);
        const minutes = Math.floor((remaining / 1000 / 60) % 60);

        if (minutes > 0) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}${seconds > 0 ? ` ${seconds} seconds` : ''}`;
        } else if (seconds > 0) {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        } else {
            return 'less than a second';
        }
    }

    /**
     * Check if timeout has occurred
     * @returns {boolean} True if timeout has occurred
     */
    hasTimedOut() {
        if (!this.startTime) return false;
        return this.getElapsedTime() >= this.maxDuration;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProcessingTimeout;
}
