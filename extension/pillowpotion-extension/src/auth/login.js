/**
 * Login page script
 * Handles authentication UI logic
 */

import authService from '../services/auth.js';

// DOM elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const loginBtn = document.getElementById('login-btn');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const passwordToggle = document.getElementById('password-toggle');
const eyeOpen = document.getElementById('eye-open');
const eyeClosed = document.getElementById('eye-closed');
const signupLink = document.getElementById('signup-link');
const forgotLink = document.getElementById('forgot-link');

/**
 * Show error message
 */
function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.classList.add('hidden');
  errorText.textContent = '';
}

/**
 * Set button loading state
 */
function setLoading(loading) {
  loginBtn.disabled = loading;
  if (loading) {
    loginBtn.classList.add('btn-loading');
    loginBtn.dataset.originalText = loginBtn.textContent;
  } else {
    loginBtn.classList.remove('btn-loading');
    if (loginBtn.dataset.originalText) {
      loginBtn.textContent = loginBtn.dataset.originalText;
    }
  }
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();

  // Clear previous errors
  hideError();

  // Get form values
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const remember = rememberCheckbox.checked;

  // Validate
  if (!email || !password) {
    showError('Please fill in all fields');
    return;
  }

  // Show loading
  setLoading(true);

  try {
    // Call auth service
    const result = await authService.login(email, password, remember);

    if (result.success) {
      // Redirect to main app
      window.location.href = '/src/ui/side-panel/index.html';
    } else {
      // Show error
      showError(result.error);
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('An unexpected error occurred. Please try again.');
  } finally {
    setLoading(false);
  }
}

/**
 * Toggle password visibility
 */
function togglePassword() {
  const type = passwordInput.type === 'password' ? 'text' : 'password';
  passwordInput.type = type;

  if (type === 'password') {
    eyeOpen.style.display = 'block';
    eyeClosed.style.display = 'none';
  } else {
    eyeOpen.style.display = 'none';
    eyeClosed.style.display = 'block';
  }
}

/**
 * Open signup page
 */
function openSignup() {
  authService.openSignupPage();
}

/**
 * Open forgot password page
 */
function openForgotPassword() {
  authService.openForgotPasswordPage();
}

/**
 * Check if already logged in
 */
async function checkExistingAuth() {
  const isLoggedIn = await authService.isLoggedIn();
  if (isLoggedIn) {
    // Verify token is still valid
    const user = await authService.checkAuth();
    if (user) {
      // Already logged in, redirect to main app
      window.location.href = '/src/ui/side-panel/index.html';
    }
  }
}

// Event listeners
loginForm.addEventListener('submit', handleLogin);
passwordToggle.addEventListener('click', togglePassword);
signupLink.addEventListener('click', openSignup);
forgotLink.addEventListener('click', openForgotPassword);

// Check existing auth on load
checkExistingAuth();
