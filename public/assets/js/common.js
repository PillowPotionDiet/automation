/**
 * AI Video Generator - Common JavaScript
 * Shared utilities and functionality across all pages
 */

const App = {
    // Base path for Hostinger GitHub deployment (automation.pillowpotion.com/public/)
    basePath: '/public',

    // API base URL
    apiBase: '/public/api',

    // Current user
    user: null,

    /**
     * Initialize the application
     */
    init() {
        this.loadUser();
        this.setupHeader();
        this.setupToasts();
        this.setupModals();
        this.updateCreditsDisplay();
    },

    /**
     * Load user from storage
     */
    loadUser() {
        const userData = localStorage.getItem('user');
        if (userData) {
            this.user = JSON.parse(userData);
        }
    },

    /**
     * Setup header functionality
     */
    setupHeader() {
        // Update user info in header
        const emailEl = document.getElementById('user-email');
        const creditsEl = document.getElementById('credits-balance');

        if (this.user) {
            if (emailEl) emailEl.textContent = this.user.email;
            if (creditsEl) creditsEl.textContent = this.formatNumber(this.user.credits || 0);
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Header scroll effect
        const header = document.querySelector('.global-header, .landing-header');
        if (header) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        }
    },

    /**
     * Setup toast notifications
     */
    setupToasts() {
        // Create toast container if not exists
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    },

    /**
     * Setup modal functionality
     */
    setupModals() {
        // Close modal on overlay click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.closeModal(e.target);
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay:not(.hidden)');
                if (modal) this.closeModal(modal);
            }
        });
    },

    /**
     * Update credits display
     */
    async updateCreditsDisplay() {
        if (!this.user) return;

        try {
            const response = await this.apiGet('/user/credits.php');
            if (response.success) {
                this.user.credits = response.data.balance;
                localStorage.setItem('user', JSON.stringify(this.user));

                const creditsEl = document.getElementById('credits-balance');
                if (creditsEl) {
                    creditsEl.textContent = this.formatNumber(response.data.balance);
                }
            }
        } catch (error) {
            console.error('Failed to update credits:', error);
        }
    },

    /**
     * Poll for generation status
     */
    async pollGenerationStatus(requestUuid, onUpdate, onComplete, onError, interval = 3000) {
        const poll = async () => {
            try {
                const response = await this.apiGet(`/tools/status.php?uuid=${requestUuid}`);

                if (response.success) {
                    const { status, result_url, error_message } = response.data;

                    if (onUpdate) onUpdate(response.data);

                    if (status === 'completed') {
                        if (onComplete) onComplete(result_url, response.data);
                        return;
                    } else if (status === 'failed') {
                        if (onError) onError(error_message || 'Generation failed');
                        return;
                    }

                    // Continue polling
                    setTimeout(poll, interval);
                } else {
                    if (onError) onError(response.error || 'Failed to check status');
                }
            } catch (error) {
                console.error('Polling error:', error);
                if (onError) onError('Network error while checking status');
            }
        };

        poll();
    },

    /**
     * Generate image via API
     */
    async generateImage(prompt, model = 'flux', aspectRatio = '1:1') {
        const response = await this.apiPost('/tools/text-to-image.php', {
            prompt,
            model,
            aspect_ratio: aspectRatio
        });
        return response;
    },

    /**
     * Generate video via API
     */
    async generateVideo(prompt, model = 'kling-standard', duration = 5) {
        const response = await this.apiPost('/tools/text-to-video.php', {
            prompt,
            model,
            duration
        });
        return response;
    },

    /**
     * Generate script-to-video via API
     */
    async generateScriptToVideo(title, scenes, model = 'kling-pro') {
        const response = await this.apiPost('/tools/script-to-video.php', {
            title,
            scenes,
            model
        });
        return response;
    },

    /**
     * Show toast notification
     */
    toast(message, type = 'success', duration = 5000) {
        const container = document.querySelector('.toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
            <span class="toast-message">${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        let overlay = document.querySelector('.loading-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner"></div>
                <p class="loading-message">${message}</p>
            `;
            document.body.appendChild(overlay);
        } else {
            overlay.querySelector('.loading-message').textContent = message;
            overlay.classList.remove('hidden');
        }
    },

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    },

    /**
     * Open modal
     */
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Close modal
     */
    closeModal(modal) {
        if (typeof modal === 'string') {
            modal = document.getElementById(modal);
        }
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    /**
     * Confirm dialog
     */
    confirm(message, onConfirm, onCancel) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Confirm</h2>
                <p>${message}</p>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
                    <button class="btn btn-primary" id="confirm-ok">Confirm</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('#confirm-ok').addEventListener('click', () => {
            modal.remove();
            if (onConfirm) onConfirm();
        });

        modal.querySelector('#confirm-cancel').addEventListener('click', () => {
            modal.remove();
            if (onCancel) onCancel();
        });
    },

    /**
     * API GET request
     */
    async apiGet(endpoint) {
        const response = await fetch(this.apiBase + endpoint, {
            credentials: 'include'
        });
        return response.json();
    },

    /**
     * API POST request
     */
    async apiPost(endpoint, data) {
        const response = await fetch(this.apiBase + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        return response.json();
    },

    /**
     * API PUT request
     */
    async apiPut(endpoint, data) {
        const response = await fetch(this.apiBase + endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });
        return response.json();
    },

    /**
     * API DELETE request
     */
    async apiDelete(endpoint) {
        const response = await fetch(this.apiBase + endpoint, {
            method: 'DELETE',
            credentials: 'include'
        });
        return response.json();
    },

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    /**
     * Format date
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Format relative time
     */
    formatRelativeTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    },

    /**
     * Generate UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Logout
     */
    async logout() {
        try {
            await this.apiPost('/auth/logout.php');
        } catch (e) {
            // Ignore errors
        }
        localStorage.removeItem('user');
        window.location.href = this.basePath + '/auth/login.html';
    },

    /**
     * Check if user has enough credits
     */
    hasCredits(amount) {
        return this.user && this.user.credits >= amount;
    },

    /**
     * Deduct credits locally (after successful API call)
     */
    deductCredits(amount) {
        if (this.user) {
            this.user.credits -= amount;
            localStorage.setItem('user', JSON.stringify(this.user));
            this.updateCreditsDisplay();
        }
    },

    /**
     * Copy to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.toast('Copied to clipboard!', 'success');
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    },

    /**
     * Download file from URL
     */
    downloadFile(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}
