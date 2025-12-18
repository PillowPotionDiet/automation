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

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
