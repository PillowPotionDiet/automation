/**
 * GENERATION CONTROLLER
 * Handles pause, resume, force stop, and restart functionality
 */

const GenerationController = {
    state: {
        paused: false,
        force_stopped: false,
        activeRequests: [],
        completedRequests: [],
        totalTasks: 0,
        pendingTasks: []
    },

    /**
     * Initialize controller
     */
    init(totalTasks) {
        this.state.totalTasks = totalTasks;
        this.state.paused = false;
        this.state.force_stopped = false;
        this.state.activeRequests = StateManager.getActiveRequests() || [];
        this.state.completedRequests = [];
        this.state.pendingTasks = [];
        this.updateUI();
    },

    /**
     * Check if can send new request
     */
    canSendRequest() {
        return !this.state.paused && !this.state.force_stopped;
    },

    /**
     * Add task to pending queue
     */
    addPendingTask(task) {
        this.state.pendingTasks.push(task);
    },

    /**
     * Get next pending task
     */
    getNextPendingTask() {
        return this.state.pendingTasks.shift();
    },

    /**
     * Has pending tasks
     */
    hasPendingTasks() {
        return this.state.pendingTasks.length > 0;
    },

    /**
     * Add active request
     */
    addActiveRequest(request) {
        this.state.activeRequests.push(request);
        StateManager.saveActiveRequests(this.state.activeRequests);
        this.updateUI();
    },

    /**
     * Mark request as completed
     */
    completeRequest(uuid) {
        const index = this.state.activeRequests.findIndex(r => r.uuid === uuid);
        if (index !== -1) {
            const request = this.state.activeRequests.splice(index, 1)[0];
            this.state.completedRequests.push(request);
            StateManager.saveActiveRequests(this.state.activeRequests);
            this.updateUI();
        }
    },

    /**
     * Find active request by UUID
     */
    findActiveRequest(uuid) {
        return this.state.activeRequests.find(r => r.uuid === uuid);
    },

    /**
     * Is UUID active (to filter old webhook events)
     */
    isActiveUUID(uuid) {
        return this.state.activeRequests.some(r => r.uuid === uuid);
    },

    /**
     * Pause generation
     */
    pause() {
        this.state.paused = true;
        this.updateUI();
        Utils.showSuccess('Generation paused');
    },

    /**
     * Resume generation
     */
    resume() {
        this.state.paused = false;
        this.updateUI();
        Utils.showSuccess('Generation resumed');

        // Trigger resume event
        if (window.onGenerationResume) {
            window.onGenerationResume();
        }
    },

    /**
     * Force stop generation
     */
    forceStop() {
        this.state.force_stopped = true;
        this.state.paused = false;
        this.state.pendingTasks = [];
        this.updateUI();
        Utils.showSuccess('Generation stopped. You may restart from the beginning.');
    },

    /**
     * Restart from beginning
     */
    restart() {
        // Clear all state
        this.state.paused = false;
        this.state.force_stopped = false;
        this.state.activeRequests = [];
        this.state.completedRequests = [];
        this.state.pendingTasks = [];

        StateManager.saveActiveRequests([]);
        this.updateUI();

        Utils.showSuccess('Restarting generation...');

        // Trigger restart event
        if (window.onGenerationRestart) {
            window.onGenerationRestart();
        }
    },

    /**
     * Update UI controls
     */
    updateUI() {
        const pauseBtn = document.getElementById('pauseBtn');
        const resumeBtn = document.getElementById('resumeBtn');
        const stopBtn = document.getElementById('stopBtn');
        const restartBtn = document.getElementById('restartBtn');
        const statusText = document.getElementById('generationStatus');

        if (!pauseBtn) return; // UI not ready

        // Update buttons
        if (this.state.force_stopped) {
            pauseBtn.disabled = true;
            resumeBtn.disabled = true;
            stopBtn.disabled = true;
            restartBtn.disabled = false;
            if (statusText) statusText.textContent = 'Stopped';
        } else if (this.state.paused) {
            pauseBtn.disabled = true;
            resumeBtn.disabled = false;
            stopBtn.disabled = false;
            restartBtn.disabled = false;
            if (statusText) statusText.textContent = 'Paused';
        } else {
            pauseBtn.disabled = false;
            resumeBtn.disabled = true;
            stopBtn.disabled = false;
            restartBtn.disabled = false;
            if (statusText) statusText.textContent = this.state.activeRequests.length > 0 ? 'Generating...' : 'Ready';
        }

        // Update progress
        const progressText = document.getElementById('progressText');
        if (progressText) {
            const completed = this.state.completedRequests.length;
            const total = this.state.totalTasks;
            progressText.textContent = `${completed} / ${total} completed`;
        }
    },

    /**
     * Get current stats
     */
    getStats() {
        return {
            total: this.state.totalTasks,
            completed: this.state.completedRequests.length,
            active: this.state.activeRequests.length,
            pending: this.state.pendingTasks.length,
            paused: this.state.paused,
            stopped: this.state.force_stopped
        };
    }
};

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GenerationController;
}
