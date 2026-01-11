/**
 * PROCESSING HEARTBEAT UTILITY
 * Monitors processing to detect stalls and hangs
 * Ensures processing is progressing and not stuck
 */

class ProcessingHeartbeat {
    /**
     * Create a processing heartbeat monitor
     * @param {number} intervalMs - Check interval in milliseconds (default: 5 seconds)
     * @param {number} stallThreshold - Time without heartbeat before considering stalled (default: 15 seconds)
     */
    constructor(intervalMs = 5000, stallThreshold = 15000) {
        this.intervalMs = intervalMs;
        this.stallThreshold = stallThreshold;
        this.lastHeartbeat = null;
        this.intervalId = null;
        this.isRunning = false;
    }

    /**
     * Start monitoring for stalls
     * @param {function} onStall - Callback function to call when stall is detected
     */
    start(onStall) {
        this.lastHeartbeat = Date.now();
        this.isRunning = true;

        this.intervalId = setInterval(() => {
            const timeSinceLastBeat = Date.now() - this.lastHeartbeat;

            // Check if processing has stalled
            if (timeSinceLastBeat > this.stallThreshold) {
                console.warn(`[Heartbeat] Processing stalled: ${timeSinceLastBeat}ms since last heartbeat`);

                if (onStall) {
                    onStall({
                        type: 'stall',
                        timeSinceLastBeat,
                        message: 'Processing appears to have stalled. The system may be unresponsive. Please try again with a shorter script or fewer paragraphs/scenes.'
                    });
                }

                this.stop();
            }
        }, this.intervalMs);
    }

    /**
     * Record a heartbeat (call this during processing to indicate progress)
     */
    beat() {
        this.lastHeartbeat = Date.now();
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
    }

    /**
     * Get time since last heartbeat
     * @returns {number} Time in milliseconds since last beat
     */
    getTimeSinceLastBeat() {
        if (!this.lastHeartbeat) return 0;
        return Date.now() - this.lastHeartbeat;
    }

    /**
     * Check if currently monitoring
     * @returns {boolean} True if heartbeat is active
     */
    isActive() {
        return this.isRunning && this.intervalId !== null;
    }

    /**
     * Reset heartbeat (same as calling beat())
     */
    reset() {
        this.beat();
    }

    /**
     * Check if processing might be stalled (without triggering callback)
     * @returns {boolean} True if time since last beat exceeds threshold
     */
    isPotentiallyStalled() {
        if (!this.lastHeartbeat) return false;
        return this.getTimeSinceLastBeat() > this.stallThreshold;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProcessingHeartbeat;
}
