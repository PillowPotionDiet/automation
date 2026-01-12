/**
 * Auth Wrapper
 * Injects authentication UI into the main app
 * Checks auth status and redirects to login if needed
 */

import authService from '../services/auth.js';
import creditsService from '../services/credits.js';

class AuthWrapper {
  constructor() {
    this.user = null;
    this.credits = 0;
    this.headerElement = null;
  }

  /**
   * Initialize auth wrapper
   */
  async init() {
    // Check authentication
    const isAuthenticated = await this.checkAuth();

    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/src/auth/login.html';
      return;
    }

    // Inject auth header
    this.injectAuthHeader();

    // Start credits polling
    this.startCreditsPolling();
  }

  /**
   * Check if user is authenticated
   */
  async checkAuth() {
    try {
      this.user = await authService.checkAuth();
      if (this.user) {
        this.credits = this.user.credits || 0;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  /**
   * Inject auth header into the page
   */
  injectAuthHeader() {
    // Create credit header
    const header = document.createElement('div');
    header.className = 'auth-header-bar';

    // Enhanced dark gradient background with better styling
    header.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 12px 20px !important;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
      border-bottom: 2px solid #667eea !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
      min-height: 48px !important;
      max-height: 48px !important;
      height: 48px !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      z-index: 1000 !important;
    `;

    header.innerHTML = `
      <div class="credits-badge" style="display: inline-flex !important; align-items: center !important; gap: 8px !important; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; padding: 8px 16px !important; border-radius: 999px !important; color: white !important; font-weight: 700 !important; font-size: 0.9375rem !important; white-space: nowrap !important; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important; margin: 0 !important; flex-shrink: 0 !important; box-sizing: border-box !important;">
        <span class="credits-icon" style="font-size: 1rem !important; line-height: 1 !important; margin: 0 !important; padding: 0 !important;">💎</span>
        <span class="credits-balance" id="credits-display" style="font-size: 0.9375rem !important; font-weight: 800 !important; line-height: 1 !important; margin: 0 !important; padding: 0 !important;">${this.formatCredits(this.credits)}</span>
      </div>

      <div class="user-menu" style="display: flex !important; align-items: center !important; gap: 12px !important; margin: 0 !important; padding: 0 !important; flex-shrink: 0 !important;">
        <span class="user-email" title="${this.user.email}" style="font-size: 0.8125rem !important; color: #e9ecef !important; margin: 0 !important; padding: 0 !important; line-height: 1 !important;">${this.user.email}</span>
        <button class="btn-logout" id="logout-btn" style="padding: 6px 12px !important; background: rgba(255, 255, 255, 0.1) !important; color: white !important; border-radius: 999px !important; font-size: 0.8125rem !important; font-weight: 500 !important; border: 1px solid rgba(255, 255, 255, 0.2) !important; cursor: pointer !important; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; white-space: nowrap !important; margin: 0 !important; line-height: 1 !important; box-sizing: border-box !important; transition: all 0.2s !important;">Logout</button>
      </div>
    `;

    // Insert credit header at the top of body
    const app = document.getElementById('app');
    if (app) {
      document.body.insertBefore(header, app);
    } else {
      document.body.insertBefore(header, document.body.firstChild);
    }

    this.headerElement = header;

    // Add logout button hover effect
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('mouseenter', () => {
      logoutBtn.style.background = '#dc3545 !important';
      logoutBtn.style.borderColor = '#dc3545 !important';
    });
    logoutBtn.addEventListener('mouseleave', () => {
      logoutBtn.style.background = 'rgba(255, 255, 255, 0.1) !important';
      logoutBtn.style.borderColor = 'rgba(255, 255, 255, 0.2) !important';
    });
    logoutBtn.addEventListener('click', () => this.handleLogout());

    // Create logo + title section
    this.injectLogoSection();
  }

  /**
   * Inject logo and title section below credit header
   */
  injectLogoSection() {
    const logoSection = document.createElement('div');
    logoSection.className = 'app-header-section';

    logoSection.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 4px 20px !important;
      background: #f0f2f5 !important;
      border-bottom: none !important;
      margin: 0 !important;
      position: fixed !important;
      top: 48px !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      z-index: 999 !important;
      box-sizing: border-box !important;
      height: 68px !important;
    `;

    logoSection.innerHTML = `
      <img src="../../../pillowpotionlogo.webp" class="app-logo" alt="PillowPotion Logo" style="width: 120px !important; height: auto !important; max-height: 60px !important; object-fit: contain !important; margin: 0 !important; padding: 0 !important; display: block !important;" />
    `;

    const app = document.getElementById('app');
    if (app) {
      document.body.insertBefore(logoSection, app);
      // Adjust app padding for both headers (48px credit header + 68px logo section = 116px)
      app.style.cssText = 'padding-top: 116px !important; margin: 0 !important;';
    }
  }

  /**
   * Start polling for credits updates
   */
  startCreditsPolling() {
    creditsService.startWatching((newCredits) => {
      this.updateCreditsDisplay(newCredits);
    });
  }

  /**
   * Update credits display
   */
  updateCreditsDisplay(credits) {
    this.credits = credits;
    const creditsDisplay = document.getElementById('credits-display');
    if (creditsDisplay) {
      creditsDisplay.textContent = this.formatCredits(credits);
    }
  }

  /**
   * Format credits number
   */
  formatCredits(credits) {
    return credits.toLocaleString();
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    const confirmLogout = confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    await authService.logout();
    window.location.href = '/src/auth/login.html';
  }

  /**
   * Get current user
   */
  getUser() {
    return this.user;
  }

  /**
   * Get current credits
   */
  getCredits() {
    return this.credits;
  }
}

// Create singleton instance
const authWrapper = new AuthWrapper();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => authWrapper.init());
} else {
  authWrapper.init();
}

// Export for use in other scripts
export default authWrapper;
