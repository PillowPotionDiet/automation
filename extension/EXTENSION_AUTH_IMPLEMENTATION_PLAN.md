# PillowPotion Extension - Authentication Implementation Plan

## Executive Summary

This document outlines the plan to add complete authentication functionality to the PillowPotion Chrome Extension, integrating it with the existing web tool's authentication system and matching its design aesthetics.

---

## Current State Analysis

### Main Tool Authentication System

**Backend Stack:**
- **Database:** MySQL with User model
- **Auth Method:** JWT tokens (HMAC-SHA256)
- **Cookie-based:** `auth_token` and `refresh_token` cookies
- **Session Management:** Database-tracked sessions
- **Password Hashing:** Bcrypt (cost: 12)

**API Endpoints:**
- `/public/api/auth/login.php` - Login endpoint
- `/public/api/auth/signup.php` - Signup endpoint
- `/public/api/auth/logout.php` - Logout endpoint
- `/public/api/auth/check.php` - Check auth status
- `/public/api/user/credits.php` - Get credits balance

**User Data Structure:**
```javascript
{
  id: number,
  email: string,
  role: 'user' | 'admin',
  credits: number,
  email_verified: boolean,
  has_api_key: boolean,
  created_at: string
}
```

### Main Tool Design System

**Color Palette:**
- **Primary Gradient:** `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Secondary Gradient:** `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`
- **Accent Gradient:** `linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)`
- **Success Gradient:** `linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)`
- **Background:** Dark gradient `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`

**Typography:**
- **Font:** Inter (loaded from Google Fonts)
- **Font Weights:** 400, 500, 600, 700, 800

**Design Features:**
- Floating gradient shapes animation
- Card-based UI with backdrop blur
- Smooth transitions (0.2s-0.5s ease)
- Ripple effects on buttons
- Box shadows with gradient glow

### Current Extension State

**Extension Type:** Chrome Manifest V3
- **Side Panel:** Vue 3 + PrimeVue
- **Storage:** chrome.storage.sync/local
- **Permissions:** storage, tabs, background, sidePanel, activeTab, downloads
- **Current Authentication:** None (needs implementation)

---

## Implementation Plan

### Phase 1: Extension UI Design & Structure

#### 1.1 Create Auth Screen Component

**File:** `extension/pillowpotion-extension/src/components/AuthScreen.vue`

**Features:**
- Login form with email/password inputs
- "Sign Up" button that redirects to main tool signup page
- "Forgot Password?" link to main tool
- Match main tool's auth.css design exactly
- Floating gradient shapes background animation
- Password visibility toggle
- Loading states with spinner

**Design Specifications:**
```vue
<!-- Auth Card Design -->
<div class="auth-card">
  <div class="auth-logo">
    <img src="logo.png" />
    <h1>PillowPotion</h1>
  </div>

  <div class="auth-header">
    <h2>Welcome Back</h2>
    <p>Sign in to automate your video generation</p>
  </div>

  <form class="auth-form">
    <div class="form-group">
      <label>Email Address</label>
      <input type="email" placeholder="Enter your email" />
    </div>

    <div class="form-group">
      <label>Password</label>
      <div class="input-with-icon">
        <input type="password" placeholder="Enter your password" />
        <span class="password-toggle">👁️</span>
      </div>
    </div>

    <button class="btn btn-primary btn-full">Sign In</button>
  </form>

  <div class="auth-footer">
    <p>Don't have an account? <a @click="openSignup">Sign up free</a></p>
    <a @click="openForgotPassword">Forgot password?</a>
  </div>
</div>

<!-- Floating shapes background -->
<div class="auth-background">
  <div class="floating-shapes">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
    <div class="shape shape-3"></div>
  </div>
</div>
```

#### 1.2 Create Authenticated Header Component

**File:** `extension/pillowpotion-extension/src/components/AuthHeader.vue`

**Features:**
- Credits badge with animated pulse
- User email display
- Logout button
- Real-time credits updates

**Design:**
```vue
<div class="auth-header-bar">
  <div class="credits-badge">
    <span class="credits-icon">💎</span>
    <div>
      <div class="credits-balance">{{ credits }}</div>
      <div class="credits-label">Credits</div>
    </div>
  </div>

  <div class="user-menu">
    <span class="user-email">{{ email }}</span>
    <button @click="logout" class="btn-logout">Logout</button>
  </div>
</div>
```

---

### Phase 2: Authentication Logic Implementation

#### 2.1 Create Auth Service

**File:** `extension/pillowpotion-extension/src/services/auth.js`

**Responsibilities:**
- Login API call
- Logout API call
- Check auth status
- Store/retrieve user data from chrome.storage
- Store/retrieve JWT token

**API Communication:**
```javascript
class AuthService {
  constructor() {
    this.API_BASE = 'https://automation.pillowpotion.com/public';
  }

  async login(email, password) {
    const response = await fetch(`${this.API_BASE}/api/auth/login.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Important for cookies
    });

    const data = await response.json();

    if (data.success) {
      // Store token and user in chrome.storage
      await chrome.storage.local.set({
        auth_token: data.data.token,
        user: data.data.user
      });

      return data.data.user;
    } else {
      throw new Error(data.message || 'Login failed');
    }
  }

  async logout() {
    await fetch(`${this.API_BASE}/api/auth/logout.php`, {
      method: 'POST',
      credentials: 'include'
    });

    // Clear storage
    await chrome.storage.local.remove(['auth_token', 'user']);
  }

  async checkAuth() {
    const { auth_token } = await chrome.storage.local.get('auth_token');

    if (!auth_token) return null;

    const response = await fetch(`${this.API_BASE}/api/auth/check.php`, {
      headers: { 'Authorization': `Bearer ${auth_token}` },
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success && data.data.authenticated) {
      return data.data.user;
    }

    return null;
  }

  async getUser() {
    const { user } = await chrome.storage.local.get('user');
    return user;
  }

  openSignupPage() {
    chrome.tabs.create({
      url: 'https://automation.pillowpotion.com/public/auth/signup.html'
    });
  }

  openForgotPasswordPage() {
    chrome.tabs.create({
      url: 'https://automation.pillowpotion.com/public/auth/forgot-password.html'
    });
  }
}
```

#### 2.2 Create Credits Service

**File:** `extension/pillowpotion-extension/src/services/credits.js`

**Responsibilities:**
- Fetch current credits balance
- Update credits display
- Listen for credit changes

```javascript
class CreditsService {
  constructor() {
    this.API_BASE = 'https://automation.pillowpotion.com/public';
  }

  async getCredits() {
    const { auth_token } = await chrome.storage.local.get('auth_token');

    const response = await fetch(`${this.API_BASE}/api/user/credits.php`, {
      headers: { 'Authorization': `Bearer ${auth_token}` },
      credentials: 'include'
    });

    const data = await response.json();

    if (data.success) {
      // Update local storage
      const { user } = await chrome.storage.local.get('user');
      user.credits = data.data.balance;
      await chrome.storage.local.set({ user });

      return data.data.balance;
    }

    return 0;
  }

  async watchCredits(callback) {
    // Poll every 30 seconds
    setInterval(async () => {
      const credits = await this.getCredits();
      callback(credits);
    }, 30000);
  }
}
```

---

### Phase 3: Vue Integration

#### 3.1 Main App State Management

**File:** `extension/pillowpotion-extension/src/App.vue`

**State:**
```vue
<script setup>
import { ref, onMounted } from 'vue';
import AuthScreen from './components/AuthScreen.vue';
import AuthHeader from './components/AuthHeader.vue';
import MainInterface from './components/MainInterface.vue';
import AuthService from './services/auth.js';
import CreditsService from './services/credits.js';

const authService = new AuthService();
const creditsService = new CreditsService();

const isAuthenticated = ref(false);
const user = ref(null);
const loading = ref(true);

onMounted(async () => {
  // Check if user is already logged in
  const existingUser = await authService.checkAuth();

  if (existingUser) {
    isAuthenticated.value = true;
    user.value = existingUser;

    // Start credits polling
    creditsService.watchCredits((credits) => {
      user.value.credits = credits;
    });
  }

  loading.value = false;
});

const handleLogin = async (userData) => {
  isAuthenticated.value = true;
  user.value = userData;

  // Start credits polling
  creditsService.watchCredits((credits) => {
    user.value.credits = credits;
  });
};

const handleLogout = async () => {
  await authService.logout();
  isAuthenticated.value = false;
  user.value = null;
};
</script>

<template>
  <div class="app">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
    </div>

    <AuthScreen
      v-else-if="!isAuthenticated"
      @login="handleLogin"
    />

    <div v-else class="authenticated-app">
      <AuthHeader
        :user="user"
        @logout="handleLogout"
      />

      <MainInterface :user="user" />
    </div>
  </div>
</template>
```

---

### Phase 4: Design System Matching

#### 4.1 Create Extension Auth Styles

**File:** `extension/pillowpotion-extension/src/styles/auth.css`

**Copy from main tool's auth.css with adaptations:**
- Floating gradient shapes animations
- Auth card design (glassmorphism)
- Button styles with gradients
- Input field styling
- Password toggle icon
- Loading states

**Color Variables:**
```css
:root {
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  --success-gradient: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);

  --primary: #667eea;
  --primary-dark: #764ba2;

  --text-primary: #2d3748;
  --text-secondary: #718096;
  --text-light: #a0aec0;

  --border-color: #e2e8f0;
  --border-radius-md: 12px;
  --border-radius-lg: 20px;

  --shadow-primary: 0 10px 30px rgba(102, 126, 234, 0.3);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.15);

  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}
```

#### 4.2 Credits Badge Animation

```css
.credits-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-gradient);
  padding: 10px 20px;
  border-radius: 50px;
  color: white;
  font-weight: 600;
  box-shadow: var(--shadow-primary);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
```

#### 4.3 Floating Shapes Animation

```css
.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.2;
  animation: float 25s ease-in-out infinite;
}

.shape-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  top: -200px;
  left: -200px;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(50px, -50px) rotate(5deg); }
  50% { transform: translate(0, -100px) rotate(-5deg); }
  75% { transform: translate(-50px, -50px) rotate(3deg); }
}
```

---

### Phase 5: Extension Permissions & Security

#### 5.1 Update manifest.json

Add host permissions for API:
```json
{
  "host_permissions": [
    "*://labs.google/*",
    "*://automation.pillowpotion.com/*"
  ]
}
```

#### 5.2 Secure Token Storage

- Store JWT token in `chrome.storage.local` (encrypted by Chrome)
- Never expose token in content scripts
- Always use HTTPS for API calls
- Implement token refresh logic

#### 5.3 CORS Handling

Ensure backend allows extension origin:
```php
header('Access-Control-Allow-Origin: chrome-extension://*');
header('Access-Control-Allow-Credentials: true');
```

---

### Phase 6: User Flow

#### 6.1 First-Time User Flow

1. User installs extension
2. Opens side panel → sees AuthScreen
3. Clicks "Sign up free" → opens web tool signup in new tab
4. User signs up on web tool
5. Returns to extension
6. Enters credentials → logs in
7. Sees authenticated interface with credits

#### 6.2 Returning User Flow

1. User opens side panel
2. Extension auto-checks auth via `checkAuth()`
3. If valid token exists → auto-login
4. If expired → shows login screen
5. User logs in again

#### 6.3 Logout Flow

1. User clicks logout button
2. API call to `/api/auth/logout.php`
3. Clear `chrome.storage.local`
4. Show AuthScreen again

---

### Phase 7: Error Handling

#### 7.1 Network Errors

- Show user-friendly error messages
- Retry mechanism for API calls
- Offline detection

#### 7.2 Invalid Credentials

- Display error below login form
- Shake animation on error
- Clear password field

#### 7.3 Session Expiry

- Detect 401 responses
- Auto-logout user
- Show "Session expired, please log in again" message

---

## Technical Requirements

### Dependencies to Install

**NPM Packages:**
```bash
# Already have Vue 3 and PrimeVue
# May need to add:
npm install @vueuse/core  # For reactive chrome storage
```

### Files to Create

1. `src/components/AuthScreen.vue` - Login UI
2. `src/components/AuthHeader.vue` - Authenticated header
3. `src/services/auth.js` - Auth logic
4. `src/services/credits.js` - Credits management
5. `src/styles/auth.css` - Auth styling
6. `src/composables/useAuth.js` - Vue composable for auth state

### Files to Modify

1. `src/App.vue` - Add auth routing
2. `src/ui/side-panel/index.html` - Add Google Fonts link
3. `manifest.json` - Add host permissions
4. `assets/index.html-B-tB0sk2.js` - Will be regenerated on build

---

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error handling)
- [ ] Signup redirect opens correct URL
- [ ] Forgot password redirect works
- [ ] Credits display shows correct balance
- [ ] Credits update in real-time (after 30s poll)
- [ ] Logout clears storage and returns to login
- [ ] Auto-login on extension reload (if token valid)
- [ ] Session expiry handling (401 response)
- [ ] Password visibility toggle works
- [ ] Loading states display correctly
- [ ] Design matches main tool aesthetics
- [ ] Animations work smoothly
- [ ] Responsive design (side panel width)

---

## Timeline Estimate

**Phase 1-2 (Structure & Logic):** Core implementation
**Phase 3 (Vue Integration):** State management
**Phase 4 (Design):** Styling and animations
**Phase 5 (Security):** Permissions and token handling
**Phase 6-7 (UX & Testing):** User flows and error handling

---

## Success Criteria

✅ User can log in from extension using web tool credentials
✅ Extension displays current credits balance
✅ Credits update automatically
✅ User can logout from extension
✅ Signup/forgot password redirect to web tool
✅ Design perfectly matches main tool aesthetics
✅ Smooth animations and transitions
✅ Secure token storage and API communication
✅ Graceful error handling

---

## Notes & Considerations

1. **Token Management:** Since the extension can't set HTTP-only cookies, we'll store the JWT token in chrome.storage.local (which is encrypted at rest by Chrome)

2. **API CORS:** Backend needs to allow extension origin. We may need to update PHP CORS headers.

3. **Token Refresh:** Implement automatic token refresh before expiry to maintain session

4. **Build Process:** After implementation, need to rebuild extension with Vite to regenerate minified bundles

5. **Extension Size:** Adding auth will increase bundle size slightly, but should stay under Chrome's limits

6. **Background Service Worker:** May need to implement token refresh logic in service worker for better UX

---

## Next Steps

1. Review and approve this plan
2. Create auth service and components
3. Implement Vue state management
4. Add styling matching main tool
5. Test authentication flow
6. Build and test in browser
7. Deploy updated extension

---

**Document Version:** 1.0
**Created:** 2026-01-02
**Author:** Claude (PillowPotion Development)
