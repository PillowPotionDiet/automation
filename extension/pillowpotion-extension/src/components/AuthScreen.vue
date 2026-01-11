<template>
  <div class="auth-page">
    <!-- Floating shapes background animation -->
    <div class="auth-background">
      <div class="floating-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>
    </div>

    <!-- Auth card -->
    <div class="auth-container">
      <div class="auth-card">
        <!-- Logo -->
        <div class="auth-logo">
          <img src="../assets/logo.png" alt="PillowPotion" />
        </div>

        <!-- Header -->
        <div class="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to automate your video generation</p>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="auth-error">
          <span class="error-icon">⚠️</span>
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Login form -->
        <form class="auth-form" @submit.prevent="handleLogin">
          <!-- Email field -->
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              required
              :disabled="loading"
            />
          </div>

          <!-- Password field -->
          <div class="form-group">
            <label for="password">Password</label>
            <div class="input-with-icon">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                required
                :disabled="loading"
              />
              <span class="password-toggle" @click="togglePassword">
                <svg v-if="!showPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </span>
            </div>
          </div>

          <!-- Form options -->
          <div class="form-options">
            <label class="remember-me">
              <input v-model="remember" type="checkbox" :disabled="loading" />
              <span>Remember me</span>
            </label>
            <a class="forgot-link" @click="openForgotPassword">Forgot password?</a>
          </div>

          <!-- Submit button -->
          <button type="submit" class="btn btn-primary btn-full" :class="{ 'btn-loading': loading }" :disabled="loading">
            Sign In
          </button>
        </form>

        <!-- Footer -->
        <div class="auth-footer">
          <p>Don't have an account? <a @click="openSignup">Sign up free</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import authService from '../services/auth.js';

// Emits
const emit = defineEmits(['login']);

// Form state
const email = ref('');
const password = ref('');
const remember = ref(false);
const showPassword = ref(false);

// UI state
const loading = ref(false);
const errorMessage = ref('');

/**
 * Toggle password visibility
 */
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

/**
 * Handle login form submission
 */
const handleLogin = async () => {
  // Clear previous errors
  errorMessage.value = '';

  // Validate
  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }

  // Show loading
  loading.value = true;

  try {
    // Call auth service
    const result = await authService.login(
      email.value,
      password.value,
      remember.value
    );

    if (result.success) {
      // Emit login event with user data
      emit('login', result.user);
    } else {
      // Show error
      errorMessage.value = result.error;
    }
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = 'An unexpected error occurred. Please try again.';
  } finally {
    loading.value = false;
  }
};

/**
 * Open signup page in new tab
 */
const openSignup = () => {
  authService.openSignupPage();
};

/**
 * Open forgot password page in new tab
 */
const openForgotPassword = () => {
  authService.openForgotPasswordPage();
};
</script>

<style scoped>
/* Component uses global auth.css styles */
</style>
