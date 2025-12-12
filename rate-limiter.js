/**
 * RATE LIMITER
 * Manages API rate limits and quota tracking for GeminiGen.ai
 *
 * Limits:
 * - 20 requests per minute
 * - 200 requests per hour
 * - 2000 requests per day
 * - 3000 total requests (API Max subscription)
 */

class RateLimiter {
    constructor() {
        // Rate limit windows
        this.requestsPerMinute = [];
        this.requestsPerHour = [];
        this.requestsPerDay = [];

        // Total quota
        this.totalRequests = 0;
        this.maxTotal = 3000; // API Max limit

        // Limits
        this.limits = {
            minute: 20,
            hour: 200,
            day: 2000
        };

        // Load persisted data
        this.loadFromStorage();

        // Cleanup interval (every 10 seconds)
        this.cleanupInterval = setInterval(() => this.cleanup(), 10000);
    }

    /**
     * Load rate limiter state from localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem('rateLimiterState');
            if (data) {
                const state = JSON.parse(data);
                this.totalRequests = state.totalRequests || 0;
                this.requestsPerMinute = state.requestsPerMinute || [];
                this.requestsPerHour = state.requestsPerHour || [];
                this.requestsPerDay = state.requestsPerDay || [];
            }
        } catch (error) {
            console.error('Error loading rate limiter state:', error);
        }
    }

    /**
     * Save rate limiter state to localStorage
     */
    saveToStorage() {
        try {
            const state = {
                totalRequests: this.totalRequests,
                requestsPerMinute: this.requestsPerMinute,
                requestsPerHour: this.requestsPerHour,
                requestsPerDay: this.requestsPerDay,
                lastUpdated: Date.now()
            };
            localStorage.setItem('rateLimiterState', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving rate limiter state:', error);
        }
    }

    /**
     * Clean up old timestamps
     */
    cleanup() {
        const now = Date.now();

        // Remove timestamps older than their respective windows
        this.requestsPerMinute = this.requestsPerMinute.filter(t => now - t < 60000);
        this.requestsPerHour = this.requestsPerHour.filter(t => now - t < 3600000);
        this.requestsPerDay = this.requestsPerDay.filter(t => now - t < 86400000);

        this.saveToStorage();
    }

    /**
     * Check if a request can be made
     * @returns {Object} Object with canRequest boolean and reason if false
     */
    canMakeRequest() {
        this.cleanup();

        // Check total quota
        if (this.totalRequests >= this.maxTotal) {
            return {
                canRequest: false,
                reason: 'quota_exceeded',
                message: getErrorMessage('QUOTA_EXCEEDED')
            };
        }

        // Check per-minute limit
        if (this.requestsPerMinute.length >= this.limits.minute) {
            const oldestRequest = this.requestsPerMinute[0];
            const waitTime = 60000 - (Date.now() - oldestRequest);
            return {
                canRequest: false,
                reason: 'rate_limit_minute',
                message: getErrorMessage('RATE_LIMIT_MINUTE'),
                waitTime: Math.ceil(waitTime / 1000) // seconds
            };
        }

        // Check per-hour limit
        if (this.requestsPerHour.length >= this.limits.hour) {
            return {
                canRequest: false,
                reason: 'rate_limit_hour',
                message: getErrorMessage('RATE_LIMIT_HOUR')
            };
        }

        // Check per-day limit
        if (this.requestsPerDay.length >= this.limits.day) {
            return {
                canRequest: false,
                reason: 'rate_limit_day',
                message: getErrorMessage('RATE_LIMIT_DAY')
            };
        }

        return { canRequest: true };
    }

    /**
     * Acquire permission to make a request
     * Waits if necessary for minute-based rate limits
     * @returns {Promise<void>}
     */
    async acquire() {
        const check = this.canMakeRequest();

        if (!check.canRequest) {
            // For minute-based limits, wait and retry
            if (check.reason === 'rate_limit_minute' && check.waitTime) {
                const waitMs = check.waitTime * 1000 + 100; // Add 100ms buffer
                console.log(`Rate limit: waiting ${waitMs}ms for minute limit`);

                // Show warning in UI
                showWarning(`Rate limit approaching. Waiting ${check.waitTime} seconds...`);

                await sleep(waitMs);
                return this.acquire(); // Retry after waiting
            }

            // For other limits, throw error
            throw new Error(check.message);
        }

        // Record the request
        const now = Date.now();
        this.requestsPerMinute.push(now);
        this.requestsPerHour.push(now);
        this.requestsPerDay.push(now);
        this.totalRequests++;

        this.saveToStorage();
        this.updateUI();
    }

    /**
     * Get remaining quota for all limits
     * @returns {Object} Object with remaining counts
     */
    getRemainingQuota() {
        this.cleanup();

        return {
            total: this.maxTotal - this.totalRequests,
            minute: this.limits.minute - this.requestsPerMinute.length,
            hour: this.limits.hour - this.requestsPerHour.length,
            day: this.limits.day - this.requestsPerDay.length
        };
    }

    /**
     * Get current usage statistics
     * @returns {Object} Usage statistics
     */
    getUsageStats() {
        this.cleanup();

        return {
            total: {
                used: this.totalRequests,
                limit: this.maxTotal,
                remaining: this.maxTotal - this.totalRequests,
                percentage: percentage(this.totalRequests, this.maxTotal)
            },
            minute: {
                used: this.requestsPerMinute.length,
                limit: this.limits.minute,
                remaining: this.limits.minute - this.requestsPerMinute.length,
                percentage: percentage(this.requestsPerMinute.length, this.limits.minute)
            },
            hour: {
                used: this.requestsPerHour.length,
                limit: this.limits.hour,
                remaining: this.limits.hour - this.requestsPerHour.length,
                percentage: percentage(this.requestsPerHour.length, this.limits.hour)
            },
            day: {
                used: this.requestsPerDay.length,
                limit: this.limits.day,
                remaining: this.limits.day - this.requestsPerDay.length,
                percentage: percentage(this.requestsPerDay.length, this.limits.day)
            }
        };
    }

    /**
     * Update UI with current usage
     */
    updateUI() {
        const stats = this.getUsageStats();

        // Update main API usage display
        const apiUsageEl = document.getElementById('apiUsage');
        if (apiUsageEl) {
            apiUsageEl.textContent = `${stats.total.used} / ${stats.total.limit}`;
        }

        // Update rate limit displays
        const rateMinuteEl = document.getElementById('rateMinute');
        if (rateMinuteEl) {
            rateMinuteEl.textContent = `${stats.minute.used} / ${stats.minute.limit}`;
        }

        const rateHourEl = document.getElementById('rateHour');
        if (rateHourEl) {
            rateHourEl.textContent = `${stats.hour.used} / ${stats.hour.limit}`;
        }

        const rateDayEl = document.getElementById('rateDay');
        if (rateDayEl) {
            rateDayEl.textContent = `${stats.day.used} / ${stats.day.limit}`;
        }

        // Update stats page displays
        const statApiUsageEl = document.getElementById('statApiUsage');
        if (statApiUsageEl) {
            statApiUsageEl.textContent = `${stats.total.used} / ${stats.total.limit}`;
        }

        const rateLimitMinuteEl = document.getElementById('rateLimitMinute');
        if (rateLimitMinuteEl) {
            rateLimitMinuteEl.textContent = `${stats.minute.used} / ${stats.minute.limit}`;
        }

        const rateLimitHourEl = document.getElementById('rateLimitHour');
        if (rateLimitHourEl) {
            rateLimitHourEl.textContent = `${stats.hour.used} / ${stats.hour.limit}`;
        }

        const rateLimitDayEl = document.getElementById('rateLimitDay');
        if (rateLimitDayEl) {
            rateLimitDayEl.textContent = `${stats.day.used} / ${stats.day.limit}`;
        }

        const rateLimitTotalEl = document.getElementById('rateLimitTotal');
        if (rateLimitTotalEl) {
            rateLimitTotalEl.textContent = `${stats.total.remaining} remaining`;
        }

        // Update status indicators
        this.updateStatusIndicators(stats);
    }

    /**
     * Update status indicators based on usage
     * @param {Object} stats - Usage statistics
     */
    updateStatusIndicators(stats) {
        const indicators = {
            rateLimitMinuteStatus: stats.minute,
            rateLimitHourStatus: stats.hour,
            rateLimitDayStatus: stats.day,
            rateLimitTotalStatus: stats.total
        };

        Object.entries(indicators).forEach(([id, stat]) => {
            const el = document.getElementById(id);
            if (el) {
                if (stat.percentage >= 90) {
                    el.textContent = '🔴';
                } else if (stat.percentage >= 70) {
                    el.textContent = '⚠️';
                } else {
                    el.textContent = '✅';
                }
            }
        });
    }

    /**
     * Reset all rate limits (for testing or admin purposes)
     */
    reset() {
        this.requestsPerMinute = [];
        this.requestsPerHour = [];
        this.requestsPerDay = [];
        this.totalRequests = 0;
        this.saveToStorage();
        this.updateUI();
        console.log('Rate limiter reset');
    }

    /**
     * Reset only time-based limits (keep total quota)
     */
    resetTimeLimits() {
        this.requestsPerMinute = [];
        this.requestsPerHour = [];
        this.requestsPerDay = [];
        this.saveToStorage();
        this.updateUI();
        console.log('Time-based rate limits reset');
    }

    /**
     * Get estimated time until next request is available
     * @returns {number} Milliseconds until next request
     */
    getTimeUntilNextRequest() {
        const check = this.canMakeRequest();

        if (check.canRequest) {
            return 0;
        }

        if (check.reason === 'rate_limit_minute' && check.waitTime) {
            return check.waitTime * 1000;
        }

        // For hour/day limits, calculate time until window resets
        if (check.reason === 'rate_limit_hour' && this.requestsPerHour.length > 0) {
            const oldestRequest = this.requestsPerHour[0];
            return 3600000 - (Date.now() - oldestRequest);
        }

        if (check.reason === 'rate_limit_day' && this.requestsPerDay.length > 0) {
            const oldestRequest = this.requestsPerDay[0];
            return 86400000 - (Date.now() - oldestRequest);
        }

        return Infinity; // Quota exceeded
    }

    /**
     * Destroy the rate limiter (cleanup)
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
    }
}

// ========== Export for module systems (optional) ==========
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateLimiter;
}
