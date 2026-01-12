/**
 * Authentication Service
 * Handles login, logout, and auth status checks
 * Integrates with PillowPotion main tool authentication API
 */

class AuthService {
  constructor() {
    // API base URL for production
    this.API_BASE = 'https://automation.pillowpotion.com/public';

    // For local development, uncomment:
    // this.API_BASE = 'http://localhost/script-to-video-generator/public';
  }

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} remember - Remember me option
   * @returns {Promise<Object>} User data
   */
  async login(email, password, remember = false) {
    try {
      const response = await fetch(`${this.API_BASE}/api/auth/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data in chrome storage
        await chrome.storage.local.set({
          auth_token: data.data.token,
          user: data.data.user,
          login_timestamp: Date.now()
        });

        return {
          success: true,
          user: data.data.user
        };
      } else {
        return {
          success: false,
          error: data.message || data.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.'
      };
    }
  }

  /**
   * Logout current user
   * @returns {Promise<boolean>}
   */
  async logout() {
    try {
      const { auth_token } = await chrome.storage.local.get('auth_token');

      if (auth_token) {
        // Call logout API
        await fetch(`${this.API_BASE}/api/auth/logout.php`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${auth_token}`
          },
          credentials: 'include'
        });
      }

      // Clear local storage
      await chrome.storage.local.remove(['auth_token', 'user', 'login_timestamp']);

      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear storage anyway
      await chrome.storage.local.remove(['auth_token', 'user', 'login_timestamp']);
      return true;
    }
  }

  /**
   * Check if user is authenticated
   * Verifies token validity with backend
   * @returns {Promise<Object|null>} User data if authenticated, null otherwise
   */
  async checkAuth() {
    try {
      const { auth_token, user } = await chrome.storage.local.get(['auth_token', 'user']);

      if (!auth_token || !user) {
        return null;
      }

      // Verify token with backend
      const response = await fetch(`${this.API_BASE}/api/auth/check.php`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth_token}`
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && data.data.authenticated) {
        // Update user data in storage
        await chrome.storage.local.set({
          user: data.data.user
        });

        return data.data.user;
      } else {
        // Token invalid, clear storage
        await this.logout();
        return null;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      // On error, return cached user if exists (offline support)
      const { user } = await chrome.storage.local.get('user');
      return user || null;
    }
  }

  /**
   * Get current user from storage
   * @returns {Promise<Object|null>}
   */
  async getUser() {
    try {
      const { user } = await chrome.storage.local.get('user');
      return user || null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Get auth token from storage
   * @returns {Promise<string|null>}
   */
  async getToken() {
    try {
      const { auth_token } = await chrome.storage.local.get('auth_token');
      return auth_token || null;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  /**
   * Check if user is logged in (quick check without API call)
   * @returns {Promise<boolean>}
   */
  async isLoggedIn() {
    const { auth_token } = await chrome.storage.local.get('auth_token');
    return !!auth_token;
  }

  /**
   * Open signup page in new tab
   */
  openSignupPage() {
    chrome.tabs.create({
      url: `${this.API_BASE}/auth/signup.html`
    });
  }

  /**
   * Open forgot password page in new tab
   */
  openForgotPasswordPage() {
    chrome.tabs.create({
      url: `${this.API_BASE}/auth/forgot-password.html`
    });
  }

  /**
   * Open main tool dashboard in new tab
   */
  openDashboard() {
    chrome.tabs.create({
      url: `${this.API_BASE}/tools/`
    });
  }

  /**
   * Make authenticated API request
   * @param {string} endpoint - API endpoint (relative to API_BASE)
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>}
   */
  async authenticatedRequest(endpoint, options = {}) {
    const token = await this.getToken();

    if (!token) {
      throw new Error('Not authenticated');
    }

    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(`${this.API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      credentials: 'include'
    });

    const data = await response.json();

    // Handle token expiration
    if (response.status === 401) {
      await this.logout();
      throw new Error('Session expired. Please log in again.');
    }

    return data;
  }
}

// Export singleton instance
export default new AuthService();
