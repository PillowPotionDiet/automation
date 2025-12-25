/**
 * AI Video Generator - Auth Module
 * Handles login, signup, password reset, email verification
 */

const Auth = {
    // Base path for Hostinger GitHub deployment (automation.pillowpotion.com/public/)
    basePath: '/public',

    // API endpoints
    endpoints: {
        login: '/public/api/auth/login.php',
        signup: '/public/api/auth/signup.php',
        logout: '/public/api/auth/logout.php',
        forgotPassword: '/public/api/auth/forgot-password.php',
        resetPassword: '/public/api/auth/reset-password.php',
        verifyEmail: '/public/api/auth/verify-email.php',
        resendVerification: '/public/api/auth/resend-verification.php',
        checkAuth: '/public/api/auth/check.php',
        refreshToken: '/public/api/auth/refresh.php'
    },

    /**
     * Initialize auth module
     */
    init() {
        this.setupFormListeners();
        this.setupPasswordToggles();
        this.setupPasswordStrength();
        this.checkAuthStatus();
    },

    /**
     * Setup form event listeners
     */
    setupFormListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Forgot password form
        const forgotForm = document.getElementById('forgot-form');
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // Reset password form
        const resetForm = document.getElementById('reset-form');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handleResetPassword(e));
        }

        // Resend verification
        const resendBtn = document.getElementById('resend-verification');
        if (resendBtn) {
            resendBtn.addEventListener('click', () => this.handleResendVerification());
        }
    },

    /**
     * Setup password visibility toggles
     */
    setupPasswordToggles() {
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const type = input.type === 'password' ? 'text' : 'password';
                input.type = type;
                this.textContent = type === 'password' ? '👁️' : '🙈';
            });
        });
    },

    /**
     * Setup password strength indicator
     */
    setupPasswordStrength() {
        const passwordInput = document.getElementById('password');
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');

        if (passwordInput && strengthBar) {
            passwordInput.addEventListener('input', (e) => {
                const strength = this.calculatePasswordStrength(e.target.value);
                this.updateStrengthIndicator(strength, strengthBar, strengthText);
            });
        }
    },

    /**
     * Calculate password strength
     */
    calculatePasswordStrength(password) {
        let strength = 0;

        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        return Math.min(strength, 4);
    },

    /**
     * Update password strength indicator
     */
    updateStrengthIndicator(strength, bar, text) {
        const segments = bar.querySelectorAll('.strength-segment');
        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
        const colors = ['', 'weak', 'weak', 'medium', 'strong'];

        segments.forEach((segment, index) => {
            segment.className = 'strength-segment';
            if (index < strength) {
                segment.classList.add(colors[strength]);
            }
        });

        if (text) {
            text.textContent = labels[strength];
            text.className = 'strength-text ' + colors[strength];
        }
    },

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('login-error');

        // Get form data
        const email = form.email.value.trim();
        const password = form.password.value;
        const remember = form.remember?.checked || false;

        // Validate
        if (!email || !password) {
            this.showError(errorDiv, 'Please fill in all fields');
            return;
        }

        // Show loading
        this.setButtonLoading(btn, true);
        this.hideError(errorDiv);

        try {
            const response = await fetch(this.endpoints.login, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, remember }),
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                // Store user data
                this.setUser(data.data.user);

                // Redirect based on role
                if (data.data.user.role === 'admin') {
                    window.location.href = this.basePath + '/admin/';
                } else {
                    window.location.href = this.basePath + '/tools/';
                }
            } else {
                // Handle validation errors (errors object) or general error (message)
                let errorMsg = data.message || data.error || 'Login failed';
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0];
                    if (firstError) errorMsg = firstError;
                }
                this.showError(errorDiv, errorMsg);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError(errorDiv, 'An error occurred. Please try again.');
        } finally {
            this.setButtonLoading(btn, false);
        }
    },

    /**
     * Handle signup form submission
     */
    async handleSignup(e) {
        e.preventDefault();

        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('signup-error');

        // Get form data
        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirm_password.value;

        // Validate
        if (!email || !password || !confirmPassword) {
            this.showError(errorDiv, 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError(errorDiv, 'Passwords do not match');
            return;
        }

        if (password.length < 8) {
            this.showError(errorDiv, 'Password must be at least 8 characters');
            return;
        }

        // Show loading
        this.setButtonLoading(btn, true);
        this.hideError(errorDiv);

        try {
            const response = await fetch(this.endpoints.signup, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to verification page
                window.location.href = this.basePath + '/auth/verify-email.html?email=' + encodeURIComponent(email);
            } else {
                // Handle validation errors (errors object) or general error (message)
                let errorMsg = data.message || data.error || 'Signup failed';
                if (data.errors) {
                    // Get first validation error
                    const firstError = Object.values(data.errors)[0];
                    if (firstError) errorMsg = firstError;
                }
                this.showError(errorDiv, errorMsg);
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showError(errorDiv, 'An error occurred. Please try again.');
        } finally {
            this.setButtonLoading(btn, false);
        }
    },

    /**
     * Handle forgot password form
     */
    async handleForgotPassword(e) {
        e.preventDefault();

        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('forgot-error');
        const successDiv = document.getElementById('forgot-success');

        const email = form.email.value.trim();

        if (!email) {
            this.showError(errorDiv, 'Please enter your email');
            return;
        }

        this.setButtonLoading(btn, true);
        this.hideError(errorDiv);

        try {
            const response = await fetch(this.endpoints.forgotPassword, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                this.hideError(errorDiv);
                if (successDiv) {
                    successDiv.textContent = 'Password reset link sent to your email';
                    successDiv.classList.remove('hidden');
                }
                form.reset();
            } else {
                this.showError(errorDiv, data.error || 'Failed to send reset link');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            this.showError(errorDiv, 'An error occurred. Please try again.');
        } finally {
            this.setButtonLoading(btn, false);
        }
    },

    /**
     * Handle reset password form
     */
    async handleResetPassword(e) {
        e.preventDefault();

        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const errorDiv = document.getElementById('reset-error');

        const password = form.password.value;
        const confirmPassword = form.confirm_password.value;
        const token = new URLSearchParams(window.location.search).get('token');

        if (!password || !confirmPassword) {
            this.showError(errorDiv, 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError(errorDiv, 'Passwords do not match');
            return;
        }

        if (password.length < 8) {
            this.showError(errorDiv, 'Password must be at least 8 characters');
            return;
        }

        if (!token) {
            this.showError(errorDiv, 'Invalid reset token');
            return;
        }

        this.setButtonLoading(btn, true);
        this.hideError(errorDiv);

        try {
            const response = await fetch(this.endpoints.resetPassword, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password })
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to login with success message
                window.location.href = this.basePath + '/auth/login.html?reset=success';
            } else {
                this.showError(errorDiv, data.error || 'Failed to reset password');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            this.showError(errorDiv, 'An error occurred. Please try again.');
        } finally {
            this.setButtonLoading(btn, false);
        }
    },

    /**
     * Handle resend verification
     */
    async handleResendVerification() {
        const btn = document.getElementById('resend-verification');
        const email = new URLSearchParams(window.location.search).get('email');

        if (!email) {
            alert('No email specified');
            return;
        }

        btn.classList.add('disabled');
        btn.textContent = 'Sending...';

        try {
            const response = await fetch(this.endpoints.resendVerification, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                btn.textContent = 'Email Sent!';
                setTimeout(() => {
                    btn.textContent = 'Resend Verification Email';
                    btn.classList.remove('disabled');
                }, 30000);
            } else {
                alert(data.error || 'Failed to resend');
                btn.textContent = 'Resend Verification Email';
                btn.classList.remove('disabled');
            }
        } catch (error) {
            console.error('Resend error:', error);
            alert('An error occurred');
            btn.textContent = 'Resend Verification Email';
            btn.classList.remove('disabled');
        }
    },

    /**
     * Check authentication status
     */
    async checkAuthStatus() {
        try {
            const response = await fetch(this.endpoints.checkAuth, {
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success && data.data.authenticated) {
                this.setUser(data.data.user);
                return true;
            } else {
                this.clearUser();
                return false;
            }
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            await fetch(this.endpoints.logout, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        this.clearUser();
        window.location.href = this.basePath + '/auth/login.html';
    },

    /**
     * Set user data in storage
     */
    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    /**
     * Get user data from storage
     */
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Clear user data
     */
    clearUser() {
        localStorage.removeItem('user');
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!this.getUser();
    },

    /**
     * Check if user is admin
     */
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    /**
     * Show error message
     */
    showError(element, message) {
        if (element) {
            element.innerHTML = `<span class="error-icon">⚠️</span>${message}`;
            element.classList.remove('hidden');
        }
    },

    /**
     * Hide error message
     */
    hideError(element) {
        if (element) {
            element.classList.add('hidden');
        }
    },

    /**
     * Set button loading state
     */
    setButtonLoading(btn, loading) {
        if (btn) {
            btn.disabled = loading;
            if (loading) {
                btn.classList.add('btn-loading');
                btn.dataset.originalText = btn.textContent;
            } else {
                btn.classList.remove('btn-loading');
                if (btn.dataset.originalText) {
                    btn.textContent = btn.dataset.originalText;
                }
            }
        }
    },

    /**
     * Redirect if not authenticated
     */
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = this.basePath + '/auth/login.html?redirect=' + encodeURIComponent(window.location.pathname);
        }
    },

    /**
     * Redirect if not admin
     */
    requireAdmin() {
        if (!this.isAdmin()) {
            window.location.href = this.basePath + '/tools/';
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Auth;
}
