/**
 * Credits Service
 * Handles credits balance fetching and management
 * Integrates with PillowPotion credits API
 */

import authService from './auth.js';

class CreditsService {
  constructor() {
    this.API_BASE = 'https://automation.pillowpotion.com/public';
    this.pollInterval = null;
    this.pollIntervalMs = 30000; // 30 seconds
  }

  /**
   * Get current credits balance
   * @returns {Promise<number>} Credits balance
   */
  async getCredits() {
    try {
      const data = await authService.authenticatedRequest('/api/user/credits.php', {
        method: 'GET'
      });

      if (data.success && data.data && data.data.balance !== undefined) {
        // Update user credits in storage
        const user = await authService.getUser();
        if (user) {
          user.credits = data.data.balance;
          await chrome.storage.local.set({ user });
        }

        return data.data.balance;
      }

      console.warn('Credits API returned unexpected data:', data);

      // Return cached credits from user object
      const user = await authService.getUser();
      return user?.credits || 0;
    } catch (error) {
      console.error('Get credits error:', error);
      console.error('Error details:', error.message);

      // Return cached credits from user object
      const user = await authService.getUser();
      return user?.credits || 0;
    }
  }

  /**
   * Get credits history and statistics
   * @returns {Promise<Object>} Credits data including history and stats
   */
  async getCreditsHistory() {
    try {
      const data = await authService.authenticatedRequest('/api/user/credits.php', {
        method: 'GET'
      });

      if (data.success) {
        return {
          balance: data.data.balance,
          statistics: data.data.statistics,
          history: data.data.history
        };
      }

      return null;
    } catch (error) {
      console.error('Get credits history error:', error);
      return null;
    }
  }

  /**
   * Start polling for credits updates
   * @param {Function} callback - Callback function called with new credits balance
   * @returns {void}
   */
  startWatching(callback) {
    // Clear any existing interval
    this.stopWatching();

    // Initial fetch
    this.getCredits().then(callback);

    // Start polling
    this.pollInterval = setInterval(async () => {
      const credits = await this.getCredits();
      callback(credits);
    }, this.pollIntervalMs);
  }

  /**
   * Stop polling for credits updates
   * @returns {void}
   */
  stopWatching() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  /**
   * Get cached credits from storage (no API call)
   * @returns {Promise<number>}
   */
  async getCachedCredits() {
    const user = await authService.getUser();
    return user?.credits || 0;
  }

  /**
   * Update credits after a transaction
   * @param {number} amount - Amount to add/subtract
   * @returns {Promise<number>} New balance
   */
  async updateLocalCredits(amount) {
    const user = await authService.getUser();
    if (user) {
      user.credits = Math.max(0, user.credits + amount);
      await chrome.storage.local.set({ user });
      return user.credits;
    }
    return 0;
  }

  /**
   * Deduct credits locally (optimistic update)
   * Will be synced on next poll
   * @param {number} amount - Amount to deduct
   * @returns {Promise<boolean>} Success
   */
  async deductCredits(amount) {
    const user = await authService.getUser();
    if (user && user.credits >= amount) {
      user.credits -= amount;
      await chrome.storage.local.set({ user });
      return true;
    }
    return false;
  }

  /**
   * Check if user has enough credits
   * @param {number} required - Required credits
   * @returns {Promise<boolean>}
   */
  async hasEnoughCredits(required) {
    const credits = await this.getCachedCredits();
    return credits >= required;
  }

  /**
   * Format credits number with comma separator
   * @param {number} credits - Credits number
   * @returns {string} Formatted string
   */
  formatCredits(credits) {
    return credits.toLocaleString();
  }

  /**
   * Listen for credit changes from chrome.storage
   * Useful for syncing across multiple extension views
   * @param {Function} callback - Called when credits change
   */
  onCreditsChange(callback) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.user) {
        const newCredits = changes.user.newValue?.credits;
        const oldCredits = changes.user.oldValue?.credits;

        if (newCredits !== undefined && newCredits !== oldCredits) {
          callback(newCredits);
        }
      }
    });
  }
}

// Export singleton instance
export default new CreditsService();
