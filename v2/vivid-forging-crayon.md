# AI SaaS Platform Implementation Plan
## Script-to-Video Generator: User Management, Authentication & Credit System

---

## 🎯 OBJECTIVE
Convert the existing free client-side tool into a production-grade SaaS platform with:
- Database-backed authentication system
- Credit-based pricing and deduction
- User & Admin dashboards
- Access control (block tools before login)
- Manual credit top-up workflow

**DO NOT**: Rebuild generation engines (they already work perfectly)

---

## 🏗 TECHNOLOGY STACK (FINAL)

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Backend | PHP 8.x (Structured MVC) | Existing stack, hosting compatible |
| Database | MySQL 8+ | Available on current hosting |
| Authentication | JWT + HttpOnly Cookies | Secure, stateless, works across pages |
| Email | SMTP (Gmail/Hosting) | Immediate, no vendor lock-in |
| Frontend | Vanilla JavaScript (Enhanced) | Consistent with existing codebase |
| Sessions | JWT Tokens | No PHP sessions, scalable |
| Payments | Manual Admin Approval | Full control, no gateway fees |

---

## 📊 DATABASE SCHEMA

### Table: `users`
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  credits INT DEFAULT 0,
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_token VARCHAR(255),
  reset_token_expiry DATETIME,
  api_key VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_api_key (api_key)
);
```

### Table: `user_sessions`
```sql
CREATE TABLE user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255),
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token_hash)
);
```

### Table: `credits_ledger`
```sql
CREATE TABLE credits_ledger (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount INT NOT NULL COMMENT 'Positive for add, negative for deduct',
  balance_after INT NOT NULL,
  transaction_type ENUM('signup_bonus', 'purchase', 'admin_topup', 'image_generation', 'video_generation', 'admin_deduction') NOT NULL,
  reference_id VARCHAR(255) COMMENT 'Generation UUID or purchase request ID',
  model_used VARCHAR(100) COMMENT 'e.g., Veo 3.1 Fast HD, Nano Banana',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_transaction_type (transaction_type)
);
```

### Table: `plans`
```sql
CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  credits INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO plans (name, price, credits) VALUES
('Free', 0.00, 20),
('Basic Creator', 20.00, 1000),
('Pro Creator', 50.00, 3000),
('Max Plan', 100.00, 6500),
('Agency Plan', 300.00, 20000);
```

### Table: `credit_requests`
```sql
CREATE TABLE credit_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  credits INT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  payment_proof TEXT COMMENT 'Optional: user can upload proof',
  admin_notes TEXT,
  approved_by INT COMMENT 'Admin user ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id)
);
```

### Table: `generation_logs`
```sql
CREATE TABLE generation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  api_key_used VARCHAR(255) NOT NULL COMMENT 'Which API key was used for this generation',
  generation_type ENUM('image', 'video', 'text') NOT NULL,
  model VARCHAR(100) NOT NULL,
  credits_charged INT NOT NULL COMMENT 'Fixed credits WE charged the user',
  actual_credits_used INT DEFAULT NULL COMMENT 'Actual credits GeminiGen charged (from API response)',
  request_uuid VARCHAR(255),
  prompt TEXT,
  result_url TEXT,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_api_key_used (api_key_used),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

**Field Explanation:**
- `credits_charged`: FIXED rate we charge users (2, 3, 5, 20, 100 based on our pricing)
- `actual_credits_used`: REAL credits GeminiGen API consumed (from `used_credit` field in API response)
- `api_key_used`: Which admin-assigned API key was used

### Table: `admin_actions`
```sql
CREATE TABLE admin_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  action_type ENUM('credit_topup', 'credit_deduction', 'approve_request', 'reject_request', 'assign_api_key', 'verify_user', 'reset_password') NOT NULL,
  target_user_id INT,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  FOREIGN KEY (target_user_id) REFERENCES users(id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_action_type (action_type)
);
```

---

## 📁 FILE STRUCTURE (NEW)

```
/
├── app/
│   ├── config/
│   │   ├── database.php           # DB connection
│   │   ├── jwt.php                # JWT secret & config
│   │   └── email.php              # SMTP settings
│   │
│   ├── models/
│   │   ├── User.php               # User model
│   │   ├── Credit.php             # Credit ledger operations
│   │   ├── CreditRequest.php      # Credit request model
│   │   ├── GenerationLog.php      # Generation history
│   │   └── Plan.php               # Pricing plans
│   │
│   ├── controllers/
│   │   ├── AuthController.php     # Login, signup, verify, reset
│   │   ├── UserController.php     # User tools page, profile
│   │   ├── AdminController.php    # Admin dashboard operations
│   │   ├── CreditController.php   # Credit operations & deduction
│   │   └── NotificationController.php  # Admin notifications for credit requests
│   │
│   ├── services/
│   │   ├── AuthService.php        # JWT generation/validation
│   │   ├── EmailService.php       # Email sending
│   │   ├── CreditService.php      # Credit calculation & deduction logic
│   │   ├── APIKeyService.php      # API key generation
│   │   └── NotificationService.php # Admin notification system
│   │
│   ├── middlewares/
│   │   ├── AuthMiddleware.php     # Verify JWT, check login
│   │   ├── AdminMiddleware.php    # Check admin role
│   │   ├── CreditMiddleware.php   # Check credits before generation
│   │   └── EmailVerifiedMiddleware.php  # Check email verification
│   │
│   └── utils/
│       ├── Database.php           # PDO wrapper
│       ├── Response.php           # JSON response helper
│       └── Validator.php          # Input validation
│
├── public/
│   ├── index.php                  # NEW: Public homepage (landing page)
│   ├── login.html                 # Login page
│   ├── signup.html                # Signup page
│   ├── verify-email.html          # Email verification handler
│   ├── forgot-password.html       # Password reset request
│   ├── reset-password.html        # Password reset form
│   │
│   ├── tools/                     # NEW: Main user hub after login
│   │   ├── index.html             # Tools selection page (main hub)
│   │   │
│   │   ├── text-to-video/         # NEW: Text to Video tool
│   │   │   └── index.html         # Full tool page
│   │   │
│   │   ├── text-to-image/         # NEW: Text to Image tool
│   │   │   └── index.html         # Full tool page
│   │   │
│   │   └── history/               # Generation history
│   │       └── index.html         # History page
│   │
│   ├── admin/
│   │   ├── index.html             # Admin dashboard
│   │   ├── users.html             # User management
│   │   ├── credit-requests.html   # Credit request approvals
│   │   ├── notifications.html     # Admin notifications center
│   │   └── logs.html              # Generation logs & monitoring
│   │
│   ├── v2/                        # EXISTING: AI Youtube Story Generator (Page 1-5)
│   │   ├── index.html             # Page 1 (PROTECTED) - Script input
│   │   ├── page2.html             # Page 2 (PROTECTED) - Scene editing
│   │   ├── page3.html             # Page 3 (PROTECTED) - Image generation
│   │   ├── page4.html             # Page 4 (PROTECTED) - Video generation
│   │   ├── page5.html             # Page 5 (PROTECTED) - Final stitching
│   │   └── ... (existing files: api-handler.js, state-manager.js, etc.)
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   ├── auth.css           # Auth pages styling
│   │   │   ├── tools.css          # Tools page (main hub) styling
│   │   │   ├── admin.css          # Admin panel styling
│   │   │   ├── landing.css        # Homepage styling
│   │   │   └── common.css         # Shared styles (headers, credits badge)
│   │   │
│   │   └── js/
│   │       ├── auth.js            # Auth form handling
│   │       ├── tools-page.js      # Tools selection page logic
│   │       ├── admin.js           # Admin panel logic
│   │       ├── credit-checker.js  # Pre-generation credit validation
│   │       ├── api-webhook-validator.js  # API/Webhook validation popup
│   │       └── global-auth.js     # JWT handling, logout, session check
│   │
│   └── api/
│       ├── auth/
│       │   ├── login.php
│       │   ├── signup.php
│       │   ├── verify-email.php
│       │   ├── forgot-password.php
│       │   ├── reset-password.php
│       │   ├── logout.php
│       │   └── me.php             # Get current user data (credentials)
│       │
│       ├── user/
│       │   ├── tools-dashboard.php  # Tools page data
│       │   ├── profile.php
│       │   ├── history.php
│       │   └── request-credits.php  # Submit credit purchase request
│       │
│       ├── admin/
│       │   ├── users.php          # List/manage users
│       │   ├── topup-credits.php  # Manual credit top-up
│       │   ├── approve-request.php # Approve credit requests (with custom message)
│       │   ├── reject-request.php
│       │   ├── assign-api-key.php
│       │   ├── notifications.php  # Get admin notifications
│       │   └── logs.php           # View generation logs
│       │
│       ├── credits/
│       │   ├── check.php          # Check user credits
│       │   ├── deduct.php         # Deduct credits (called before generation)
│       │   ├── balance.php        # Get current balance
│       │   └── history.php        # Credit transaction history
│       │
│       └── webhook/
│           └── receiver.php       # SINGLE webhook endpoint for ALL tools
│
├── routes/
│   └── api.php                    # Route definitions
│
├── .htaccess                      # UPDATED: Route all requests
└── init.sql                       # Database initialization script
```

---

## 🔐 AUTHENTICATION FLOW

### 1. Signup Flow
```
User submits signup form (email + password)
  ↓
POST /api/auth/signup.php
  ↓
Validate email format & password strength
  ↓
Hash password with bcrypt (cost: 12)
  ↓
Generate verification token (random 64 chars)
  ↓
Insert into users table:
  - email_verified = FALSE
  - credits = 0 (not 20 yet!)
  - role = 'user'
  ↓
Send verification email with link:
  https://automation.pillowpotion.com/verify-email.html?token={token}
  ↓
Return success: "Check your email to verify"
```

### 2. Email Verification Flow
```
User clicks verification link
  ↓
GET /verify-email.html?token={token}
  ↓
POST /api/auth/verify-email.php
  ↓
Find user by verification_token
  ↓
If found:
  - Set email_verified = TRUE
  - Clear verification_token
  - Add 20 credits (signup bonus)
  - Insert into credits_ledger:
      amount = +20
      transaction_type = 'signup_bonus'
      balance_after = 20
  ↓
Return success + show popup:
  "🎉 You received 20 free credits!"
  ↓
Auto-redirect to login page
```

### 3. Login Flow
```
User submits login form (email + password)
  ↓
POST /api/auth/login.php
  ↓
Find user by email
  ↓
Verify password with password_verify()
  ↓
Check email_verified = TRUE
  ↓
Generate JWT:
  - Payload: {user_id, email, role, credits, api_key}
  - Secret: from config/jwt.php
  - Expiry: 24 hours
  ↓
Generate refresh token (for 30 days)
  ↓
Store session in user_sessions table
  ↓
Set HttpOnly cookie:
  - Name: auth_token
  - Value: JWT
  - Secure: true (if HTTPS)
  - SameSite: Strict
  ↓
Return:
  - Success message
  - User data (email, role, credits, api_key)
  ↓
Frontend redirects:
  - If role === 'admin' → /admin/
  - Else → /tools/ (TOOLS PAGE - MAIN HUB)
```

### 4. Password Reset Flow
```
User clicks "Forgot Password"
  ↓
POST /api/auth/forgot-password.php
  ↓
Find user by email
  ↓
Generate reset_token (random 64 chars)
  ↓
Set reset_token_expiry = NOW() + 1 hour
  ↓
Send email with reset link:
  https://automation.pillowpotion.com/reset-password.html?token={token}
  ↓
User clicks link → POST /api/auth/reset-password.php
  ↓
Validate token & expiry
  ↓
Hash new password
  ↓
Update password_hash
  ↓
Clear reset_token & reset_token_expiry
  ↓
Redirect to login
```

---

## 💳 CREDIT SYSTEM (FIXED DEDUCTION)

### Credit Deduction Rules (IMMUTABLE)

**Video Generation:**
| Model | Credits |
|-------|---------|
| Veo 3.1 Fast HD | 2 |
| Veo 3.1 Fast FHD | 2 |
| Veo 2 | 20 |
| Veo 3.1 HD | 100 |
| Veo 3.1 FHD | 100 |

**Image Generation:**
| Model | Credits |
|-------|---------|
| Nano Banana | 2 |
| Imagen 4 Fast | 3 |
| Imagen 4 Ultra | 5 |

**Text Generation:**
- FREE (0 credits)

### Credit Deduction Flow

```
User initiates generation (image or video)
  ↓
Frontend calls: POST /api/credits/check.php
  - Parameters: {type: 'image|video', model: 'Veo 3.1 Fast HD'}
  ↓
Backend (CreditService.php):
  1. Get user_id from JWT
  2. Map model to fixed credit cost
  3. Query current balance from users table
  4. If balance >= cost:
       return {allowed: true, cost: X, balance: Y}
     Else:
       return {allowed: false, cost: X, balance: Y, shortfall: Z}
  ↓
Frontend checks response:
  - If allowed === false:
      Show modal: "Insufficient credits. You need X credits but have Y."
      Block generation
  - If allowed === true:
      Proceed to deduction
  ↓
Frontend calls: POST /api/credits/deduct.php
  - Parameters: {type: 'image|video', model: 'Veo 3.1 Fast HD', request_uuid: '...'}
  ↓
Backend (CreditService.php):
  1. Start transaction
  2. Lock user row: SELECT * FROM users WHERE id = ? FOR UPDATE
  3. Verify balance >= cost (double-check)
  4. Deduct credits: UPDATE users SET credits = credits - {cost}
  5. Get new balance
  6. Insert into credits_ledger:
       - amount = -cost
       - balance_after = new_balance
       - transaction_type = 'image_generation' or 'video_generation'
       - model_used = 'Veo 3.1 Fast HD'
       - reference_id = request_uuid
  7. Insert into generation_logs:
       - generation_type = 'image|video'
       - model = 'Veo 3.1 Fast HD'
       - credits_used = cost
       - request_uuid = UUID
       - status = 'pending'
  8. Commit transaction
  ↓
Return: {success: true, new_balance: X}
  ↓
Frontend proceeds with API call to GeminiGen
  ↓
After generation completes:
  - Update generation_logs.status = 'completed'
  - Store result_url
  - Set completed_at timestamp
```

### Credit Display
- Show on ALL pages (header badge)
- Update in real-time after each deduction
- Frontend: `GET /api/credits/balance.php` → returns current balance

---

## 🏠 PUBLIC HOMEPAGE (LANDING PAGE)

**File:** `/public/index.php`

**Design:** Single-page SaaS landing page

**Sections:**
1. **Hero Section**
   - Headline: "Transform Scripts into Cinematic Videos with AI"
   - Subheadline: "Powered by GeminiGen AI | Credit-based | No Subscription"
   - CTA: "Get Started - 20 Free Credits" (links to signup)

2. **Tools Overview**
   - 3 cards:
     - **AI Youtube Story Generator** (Text → Script → Images → Videos → Final Cut)
     - **Text to Video** (Direct text-to-video conversion)
     - **Text to Image** (AI image generation)
   - Each card: Icon + Description + "Learn More"

3. **How It Works**
   - Step 1: Sign up & get 20 free credits
   - Step 2: Choose your tool
   - Step 3: Generate images/videos
   - Step 4: Download & use

4. **Pricing Plans**
   - Display all 5 plans from `plans` table
   - Highlight best value (Pro Creator)
   - "Request Credits" button (requires login)

5. **Features Comparison**
   - Table comparing models & credit costs
   - Show all available AI models

6. **FAQ**
   - What are credits?
   - How do I get more credits?
   - Do credits expire? (No)
   - What AI models are supported?

7. **Call to Action**
   - "Start Creating Now" → Signup
   - "Already have an account?" → Login

**Access Control:**
- NO direct tool links
- Login/Signup buttons visible
- After login: Redirect to /tools/ (Tools Page - Main Hub)

---

## 👤 TOOLS PAGE (MAIN USER HUB)

**File:** `/public/tools/index.html`

**This is the MAIN page users see after login (NOT the old dashboard)**

**Layout:**
```
Header
  - Logo
  - Credits badge (always visible, large)
  - User email
  - [Logout] button

Main Content Area
  1. Welcome Section
     - "Welcome back, user@example.com"
     - Credit balance (prominent display)
     - Last activity timestamp

  2. Tools Grid (Main Section)
     Large cards for each tool:

     ┌─────────────────────────┐
     │ 🎬 AI Youtube Story     │
     │    Generator            │
     │                         │
     │ Text → Script → Images  │
     │ → Videos → Final Cut    │
     │                         │
     │ [Launch Tool] button    │
     └─────────────────────────┘

     ┌─────────────────────────┐
     │ 📹 Text to Video        │
     │    Generator            │
     │                         │
     │ Direct text to video    │
     │ conversion with AI      │
     │                         │
     │ [Launch Tool] button    │
     └─────────────────────────┘

     ┌─────────────────────────┐
     │ 🖼️ Text to Image        │
     │    Generator            │
     │                         │
     │ Generate images from    │
     │ text descriptions       │
     │                         │
     │ [Launch Tool] button    │
     └─────────────────────────┘

     ┌─────────────────────────┐
     │ 📜 Generation History   │
     │                         │
     │ View all past           │
     │ generations & downloads │
     │                         │
     │ [View History] button   │
     └─────────────────────────┘

  3. Credit Plans Section (Right Sidebar or Bottom)
     - Display all pricing plans
     - Each plan shows:
       - Plan name
       - Credits amount
       - Price
       - [Buy Credits] button

     When user clicks [Buy Credits]:
       → Opens request modal
       → Submits request to admin
       → User sees "Request submitted, admin will review"

  4. Recent Activity Widget (Optional)
     - Last 5 generations
     - Quick stats
```

**Navigation Flow:**
```
User clicks [Launch Tool] on "AI Youtube Story Generator"
  ↓
API/Webhook validation popup appears
  (Text: "If you are a user, skip the thinking and just click the checkbox")
  ↓
After validation → Redirect to /v2/index.html (Page 1)
  ↓
Page 1-5 flow with ONLY "← Back to Tools" button in menu
```

**Menu Structure (Hamburger or Sidebar):**
- Tools (goes back to tools page)
- AI Youtube Story Generator
- Text to Video
- Text to Image
- History
- Buy Credits (opens credit plans modal)
- Profile (view API key, email)
- Logout

**API Endpoints:**
- `GET /api/user/tools-dashboard.php` → Returns user stats, credits, recent activity
- `POST /api/user/request-credits.php` → Submit credit purchase request

---

## 🛠 ADMIN DASHBOARD

**File:** `/public/admin/index.html`

**Access Control:**
- Only accessible if `user.role === 'admin'`
- Middleware: `AdminMiddleware.php` checks role
- If non-admin tries to access → redirect to /dashboard/

**Admin User (Pre-seeded):**
```sql
INSERT INTO users (email, password_hash, role, credits, email_verified)
VALUES (
  'pillowpotion.com@gmail.com',
  '$2y$12${bcrypt_hash_of_Ali547$$$}',  -- Hash generated at runtime
  'admin',
  999999,
  TRUE
);
```

**Layout:**
```
Sidebar Navigation
  - Dashboard (Overview)
  - Users Management
  - Credit Requests
  - Generation Logs
  - API Keys
  - Settings

Main Panel

1. Overview (Dashboard Home)
   - Total users
   - Total credits distributed
   - Pending credit requests (badge)
   - Recent generations
   - Revenue (if tracking)

2. Users Management (/admin/users.html)
   Table columns:
     - Email
     - Role
     - Credits
     - Email Verified
     - Created At
     - Actions: [View] [Edit Credits] [Verify Email] [Reset Password]

   Features:
     - Search by email
     - Filter by role, verification status
     - Manually add/deduct credits
     - Assign API key

3. Credit Requests (/admin/credit-requests.html)
   Table columns:
     - User Email
     - Plan
     - Amount ($)
     - Credits
     - Status (pending/approved/rejected)
     - Created At
     - Actions: [Approve] [Reject]

   Approval Flow:
     - Admin clicks [Approve]
     - Modal: "Top up {credits} credits to {email}?"
     - On confirm:
         POST /api/admin/approve-request.php
         - Add credits to user
         - Update request status = 'approved'
         - Insert into credits_ledger
         - Insert into admin_actions
         - Send email to user: "Credits added!"

4. Generation Logs (/admin/logs.html)
   Table columns:
     - User Email
     - Type (image/video)
     - Model
     - Credits Used
     - Status
     - Created At
     - Completed At
     - Result URL (if completed)

   Features:
     - Filter by user, type, model, status
     - Date range picker
     - Export to CSV

5. API Keys Management
   - List users without API keys
   - Generate new API key (random 32 chars)
   - Assign to user
   - Email user with their API key
```

**API Endpoints:**
- `GET /api/admin/users.php` → List all users
- `POST /api/admin/topup-credits.php` → Manually add credits
- `GET /api/admin/credit-requests.php` → List requests (filter by status)
- `POST /api/admin/approve-request.php` → Approve & top-up
- `POST /api/admin/reject-request.php` → Reject request
- `POST /api/admin/assign-api-key.php` → Generate & assign API key
- `GET /api/admin/logs.php` → Generation logs with filters

---

## 🔒 ACCESS CONTROL (CRITICAL)

### Global Access Rule

**Before Login:**
- ✅ Accessible: `/index.php` (homepage), `/login.html`, `/signup.html`, `/verify-email.html`, `/forgot-password.html`, `/reset-password.html`
- ❌ Blocked: `/v2/*`, `/tools/*`, `/admin/*`

**After Login (User Role):**
- ✅ Accessible: `/tools/*` (main hub), `/v2/*` (AI Youtube Story Generator), all tool pages
- ❌ Blocked: `/admin/*`
- Default redirect: `/tools/` (Tools Page)

**After Login (Admin Role):**
- ✅ Accessible: `/tools/*`, `/v2/*`, `/admin/*`
- Default redirect: `/admin/` (Admin Dashboard)

### Middleware Implementation

**File: `/app/middlewares/AuthMiddleware.php`**
```php
class AuthMiddleware {
  public static function check() {
    // 1. Get JWT from cookie
    $token = $_COOKIE['auth_token'] ?? null;

    // 2. If no token → return error
    if (!$token) {
      Response::unauthorized('Not authenticated');
    }

    // 3. Verify JWT signature & expiry
    $payload = AuthService::verifyJWT($token);

    // 4. If invalid → return error
    if (!$payload) {
      Response::unauthorized('Invalid token');
    }

    // 5. Return user data
    return $payload; // {user_id, email, role}
  }
}
```

**File: `/app/middlewares/AdminMiddleware.php`**
```php
class AdminMiddleware {
  public static function check() {
    // 1. Verify authentication first
    $user = AuthMiddleware::check();

    // 2. Check role
    if ($user['role'] !== 'admin') {
      Response::forbidden('Admin access required');
    }

    return $user;
  }
}
```

**File: `/app/middlewares/CreditMiddleware.php`**
```php
class CreditMiddleware {
  public static function checkSufficient($user_id, $type, $model) {
    // 1. Get credit cost for model
    $cost = CreditService::getCostForModel($type, $model);

    // 2. Get user balance
    $user = User::findById($user_id);

    // 3. Check balance
    if ($user['credits'] < $cost) {
      return [
        'allowed' => false,
        'cost' => $cost,
        'balance' => $user['credits'],
        'shortfall' => $cost - $user['credits']
      ];
    }

    return [
      'allowed' => true,
      'cost' => $cost,
      'balance' => $user['credits']
    ];
  }
}
```

### Frontend Protection

**File: `/public/assets/js/global-auth.js`**
```javascript
// Run on every page load
async function checkAuth() {
  const response = await fetch('/api/auth/check.php');

  if (!response.ok) {
    // Not logged in
    const publicPages = ['/', '/login.html', '/signup.html', '/verify-email.html', '/forgot-password.html', '/reset-password.html'];
    const currentPath = window.location.pathname;

    if (!publicPages.includes(currentPath)) {
      // Redirect to login
      window.location.href = '/login.html?redirect=' + encodeURIComponent(currentPath);
    }
    return null;
  }

  const data = await response.json();
  return data.user; // {email, role, credits}
}

// Display credits in header
async function updateCreditsDisplay() {
  const response = await fetch('/api/credits/balance.php');
  const data = await response.json();

  document.getElementById('credits-badge').textContent = data.credits;
}

// Run on all protected pages
if (document.querySelector('[data-requires-auth]')) {
  checkAuth().then(user => {
    if (!user) return; // Already redirected

    // Update UI with user data
    updateCreditsDisplay();

    // Check admin access
    if (window.location.pathname.startsWith('/admin/') && user.role !== 'admin') {
      window.location.href = '/dashboard/';
    }
  });
}
```

### Tool Page Protection

**Modification: ALL Tool Pages**

**1. AI Youtube Story Generator (/v2/index.html through page5.html)**

Add at the top:
```html
<script src="/assets/js/global-auth.js"></script>
<script src="/assets/js/api-webhook-validator.js"></script>
<script>
  // Block access before authentication
  (async function() {
    const user = await checkAuth();
    if (!user) return; // Already redirected

    // Check email verification
    if (!user.email_verified) {
      alert('Please verify your email before using tools.');
      window.location.href = '/tools/';
      return;
    }

    // Update credits display
    updateCreditsDisplay();

    // Show API/Webhook validation popup (on Page 1 only)
    if (window.location.pathname.includes('index.html')) {
      showAPIWebhookValidationPopup();
    }
  })();
</script>
```

**Header modification (all v2 pages):**
```html
<header>
  <button onclick="window.location.href='/tools/'" class="back-to-tools">
    ← Back to Tools
  </button>
  <div class="credits-display">
    <span>Credits:</span>
    <span id="credits-badge">0</span>
  </div>
</header>
```

**2. Text to Video Tool (/public/tools/text-to-video/index.html)**
- Same auth check
- Same API/Webhook validation popup
- Same "← Back to Tools" button
- Same credits display

**3. Text to Image Tool (/public/tools/text-to-image/index.html)**
- Same auth check
- Same API/Webhook validation popup
- Same "← Back to Tools" button
- Same credits display

---

## 🎨 CREDIT INTEGRATION WITH EXISTING TOOLS

### Modified Files (MINIMAL CHANGES)

**1. `/v2/api-handler.js`** (Add credit check before API calls)

**Add getUserCredentials() helper:**
```javascript
// Get user credentials from JWT (stored in cookie)
async function getUserCredentials() {
  const response = await fetch('/api/auth/me.php');
  const data = await response.json();
  return {
    user_id: data.user_id,
    api_key: data.api_key,  // GeminiGen API key (admin-assigned)
    credits: data.credits
  };
}
```

**Modify generateImage():**
```javascript
async generateImage(prompt, settings) {
  // 1. Get user credentials
  const user = await getUserCredentials();

  // 2. Check credits first
  const creditCheck = await fetch('/api/credits/check.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      type: 'image',
      model: settings.model
    })
  }).then(r => r.json());

  if (!creditCheck.allowed) {
    throw new Error(`Insufficient credits. Need ${creditCheck.cost}, have ${creditCheck.balance}. Please buy more credits.`);
  }

  // 3. Deduct credits
  const deduction = await fetch('/api/credits/deduct.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      type: 'image',
      model: settings.model,
      request_uuid: generateUUID(),
      prompt: prompt
    })
  }).then(r => r.json());

  if (!deduction.success) {
    throw new Error('Credit deduction failed');
  }

  // 4. Use admin-assigned API key (NOT user's own key)
  settings.api_key = user.api_key;

  // 5. Proceed with generation
  const response = await fetch('/v2/api/generate-image.php', {
    ...settings,
    headers: {
      'x-api-key': user.api_key  // Use admin-assigned key
    }
  });

  // 6. Update credits display
  updateCreditsDisplay();

  return response.json();
}
```

**Same pattern for `generateVideo()` and `generateText()` methods**

**2. All Tool Pages Headers**

**Standardized header across all tools:**
```html
<header class="tool-header">
  <button onclick="window.location.href='/tools/'" class="back-btn">
    ← Back to Tools
  </button>

  <h1 class="tool-title">[Tool Name]</h1>

  <div class="credits-display">
    <span class="credits-label">Credits:</span>
    <span id="credits-badge" class="credits-value">Loading...</span>
  </div>
</header>
```

**Cost preview before generation (all tools):**
```javascript
// Before starting generation
const totalCost = calculateTotalCost(scenes, selectedModel);
const confirmed = confirm(`This will use ${totalCost} credits. Continue?`);
if (!confirmed) return;
```

**Model Selection UI (Role-Based Display):**

All tools must display credit costs differently based on user role.

**User View (Model Dropdown):**
```html
<select id="model-select">
  <option value="veo-3.1-fast-hd" data-credits="2">
    Veo 3.1 Fast HD - 2 credits
  </option>
  <option value="veo-2" data-credits="20">
    Veo 2 - 20 credits
  </option>
  <option value="veo-3.1-hd" data-credits="100">
    Veo 3.1 HD - 100 credits
  </option>
</select>

<div class="model-info">
  <p>Selected Model: <strong>Veo 3.1 Fast HD</strong></p>
  <p>Cost: <strong>2 credits</strong> per generation</p>
  <p class="model-description">Fast video generation in HD quality</p>
</div>
```

**Admin View (Model Dropdown):**
```html
<select id="model-select">
  <option value="veo-3.1-fast-hd" data-credits="2" data-actual="10">
    Veo 3.1 Fast HD - 2 credits (actual: ~10)
  </option>
  <option value="veo-2" data-credits="20" data-actual="20">
    Veo 2 - 20 credits (actual: ~20)
  </option>
  <option value="veo-3.1-hd" data-credits="100" data-actual="100">
    Veo 3.1 HD - 100 credits (actual: ~100)
  </option>
</select>

<div class="model-info admin-view">
  <p>Selected Model: <strong>Veo 3.1 Fast HD</strong></p>
  <p>User Charged: <strong>2 credits</strong> per generation</p>
  <p class="actual-cost">Actual GeminiGen Cost: <strong>~10 credits</strong></p>
  <p class="profit-margin">Profit Margin: <strong class="negative">-8 credits</strong> ⚠️</p>
  <p class="model-description">Fast video generation in HD quality</p>
</div>
```

**JavaScript Logic for Model Selection:**
```javascript
// /public/assets/js/model-selector.js

async function loadModelOptions(toolType) {
  // Get user role from JWT
  const user = await getUserCredentials();
  const isAdmin = user.role === 'admin';

  // Fetch model data from backend
  const response = await fetch(`/api/models/${toolType}.php`);
  const models = await response.json();

  const selectElement = document.getElementById('model-select');
  const infoElement = document.querySelector('.model-info');

  // Populate dropdown
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.id;
    option.dataset.credits = model.credits_charged;

    if (isAdmin) {
      option.dataset.actual = model.actual_credits_avg || 'unknown';
      option.textContent = `${model.name} - ${model.credits_charged} credits (actual: ~${model.actual_credits_avg || '?'})`;
    } else {
      option.textContent = `${model.name} - ${model.credits_charged} credits`;
    }

    selectElement.appendChild(option);
  });

  // Update info panel when selection changes
  selectElement.addEventListener('change', (e) => {
    const selectedOption = e.target.selectedOptions[0];
    const modelName = selectedOption.textContent.split(' - ')[0];
    const creditsCharged = selectedOption.dataset.credits;
    const actualCredits = selectedOption.dataset.actual;

    updateModelInfo(modelName, creditsCharged, actualCredits, isAdmin);
  });
}

function updateModelInfo(modelName, creditsCharged, actualCredits, isAdmin) {
  const infoElement = document.querySelector('.model-info');

  let html = `
    <p>Selected Model: <strong>${modelName}</strong></p>
    <p>Cost: <strong>${creditsCharged} credits</strong> per generation</p>
  `;

  if (isAdmin && actualCredits && actualCredits !== 'unknown') {
    const profit = parseInt(creditsCharged) - parseInt(actualCredits);
    const profitClass = profit >= 0 ? 'positive' : 'negative';
    const profitIcon = profit >= 0 ? '✅' : '⚠️';

    html += `
      <p class="actual-cost">Actual GeminiGen Cost: <strong>~${actualCredits} credits</strong></p>
      <p class="profit-margin">
        Profit Margin: <strong class="${profitClass}">${profit > 0 ? '+' : ''}${profit} credits</strong> ${profitIcon}
      </p>
    `;
  }

  html += `<p class="model-description">${getModelDescription(modelName)}</p>`;

  infoElement.innerHTML = html;
}
```

**Backend API for Model Data:**
```php
// /public/api/models/video.php (Admin Access)
<?php
require_once '../../app/middlewares/AuthMiddleware.php';

$user = AuthMiddleware::check();

// Base model data (always return)
$models = [
  [
    'id' => 'veo-3.1-fast-hd',
    'name' => 'Veo 3.1 Fast HD',
    'credits_charged' => 2,
    'description' => 'Fast video generation in HD quality'
  ],
  [
    'id' => 'veo-2',
    'name' => 'Veo 2',
    'credits_charged' => 20,
    'description' => 'High-quality video generation'
  ],
  [
    'id' => 'veo-3.1-hd',
    'name' => 'Veo 3.1 HD',
    'credits_charged' => 100,
    'description' => 'Ultra high-quality video generation'
  ]
];

// If admin, add actual average costs
if ($user['role'] === 'admin') {
  $db = Database::getInstance();

  foreach ($models as &$model) {
    // Calculate average actual cost for this model
    $stmt = $db->prepare("
      SELECT AVG(actual_credits_used) as avg_actual
      FROM generation_logs
      WHERE model = ? AND actual_credits_used IS NOT NULL
    ");
    $stmt->execute([$model['id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    $model['actual_credits_avg'] = $result['avg_actual']
      ? round($result['avg_actual'])
      : null;
  }
}

Response::success(['models' => $models]);
```

**CSS for Admin Profit Indicators:**
```css
/* /public/assets/css/common.css */

.model-info.admin-view {
  border: 2px solid #ffc107;
  background: #fff8e1;
  padding: 15px;
  border-radius: 8px;
}

.actual-cost {
  color: #666;
  font-size: 0.9em;
  font-style: italic;
}

.profit-margin {
  font-weight: bold;
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
  background: #f5f5f5;
}

.profit-margin .positive {
  color: #4caf50;
}

.profit-margin .negative {
  color: #f44336;
}
```

**Example Tool Interface:**

**Page 3 (Image Generation) - User View:**
```
┌──────────────────────────────────────────┐
│ Select AI Model                          │
│ ┌──────────────────────────────────────┐ │
│ │ Imagen 4 Fast - 3 credits         ▼ │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Selected Model: Imagen 4 Fast            │
│ Cost: 3 credits per generation           │
│ Fast image generation with good quality  │
└──────────────────────────────────────────┘
```

**Page 3 (Image Generation) - Admin View:**
```
┌──────────────────────────────────────────┐
│ Select AI Model                          │
│ ┌──────────────────────────────────────┐ │
│ │ Imagen 4 Fast - 3 credits (actual: ~3) ▼ │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Selected Model: Imagen 4 Fast            │
│ User Charged: 3 credits per generation   │
│ Actual GeminiGen Cost: ~3 credits        │
│ Profit Margin: 0 credits ✅              │
│ Fast image generation with good quality  │
└──────────────────────────────────────────┘
```

---

## 🔔 API/WEBHOOK VALIDATION POPUP (CRITICAL)

**File:** `/public/assets/js/api-webhook-validator.js`

### Purpose
This popup appears EVERY TIME a user clicks on ANY tool from the Tools Page.

### Popup Behavior
- **Non-closeable** (no X button, can't click outside to close)
- Must validate API key & webhook before allowing tool access
- User instruction: **"If you are a user, skip the thinking and just click the checkbox"**

### Popup Content
```
┌─────────────────────────────────────────────┐
│  API & Webhook Validation                   │
│                                             │
│  ⚠️ Important Setup Required                │
│                                             │
│  Before using this tool, we need to         │
│  validate your API configuration.           │
│                                             │
│  📌 If you are a user, skip the thinking    │
│     and just click the checkbox below       │
│                                             │
│  ☐ I confirm my API & Webhook are ready    │
│                                             │
│  [Validate & Continue]                      │
│                                             │
│  (This helps ensure smooth generation)      │
└─────────────────────────────────────────────┘
```

### Implementation Logic
```javascript
function showAPIWebhookValidationPopup() {
  // Create modal
  const modal = createModal({
    title: 'API & Webhook Validation',
    closeable: false  // CRITICAL: Cannot close without action
  });

  // Add content
  modal.innerHTML = `
    <div class="validation-popup">
      <div class="warning-icon">⚠️</div>
      <h3>Important Setup Required</h3>
      <p>Before using this tool, we need to validate your API configuration.</p>

      <div class="user-instruction">
        <strong>📌 If you are a user, skip the thinking and just click the checkbox below</strong>
      </div>

      <label class="checkbox-container">
        <input type="checkbox" id="api-webhook-confirm" />
        <span>I confirm my API & Webhook are ready</span>
      </label>

      <button id="validate-btn" disabled>Validate & Continue</button>

      <p class="help-text">This helps ensure smooth generation</p>
    </div>
  `;

  // Enable button only when checkbox is checked
  const checkbox = document.getElementById('api-webhook-confirm');
  const validateBtn = document.getElementById('validate-btn');

  checkbox.addEventListener('change', () => {
    validateBtn.disabled = !checkbox.checked;
  });

  // On validate
  validateBtn.addEventListener('click', async () => {
    // Get user's admin-assigned API key
    const user = await getUserCredentials();

    // Test API key (optional - can skip for simplicity)
    // Just close modal and allow access
    modal.remove();

    // Store validation timestamp (don't show again for this session)
    sessionStorage.setItem('api_validated_' + user.user_id, Date.now());
  });

  document.body.appendChild(modal);
}

// Check if already validated in this session
function isAPIValidatedThisSession() {
  const user = getUserCredentials();
  const validated = sessionStorage.getItem('api_validated_' + user.user_id);

  // If validated in last 30 minutes, skip popup
  if (validated && (Date.now() - validated < 30 * 60 * 1000)) {
    return true;
  }

  return false;
}
```

### When Popup Appears
```
User clicks [Launch Tool] on Tools Page
  ↓
Check: isAPIValidatedThisSession()
  ↓
If NO:
  → Show API/Webhook validation popup
  → Wait for user to check checkbox
  → Click "Validate & Continue"
  → Store session flag
  → Redirect to tool page
  ↓
If YES:
  → Directly redirect to tool page
```

### Single Webhook Endpoint (Backend)
**File:** `/public/api/webhook/receiver.php`

```php
<?php
// SINGLE webhook endpoint for ALL tools
// GeminiGen sends webhooks here for all generation types

require_once '../../../app/config/database.php';
require_once '../../../app/utils/Database.php';

// Get webhook payload
$payload = file_get_contents('php://input');
$data = json_decode($payload, true);

// Verify webhook signature (if GeminiGen provides one)
// verifyWebhookSignature($payload, $_SERVER['HTTP_X_SIGNATURE']);

// Extract common fields
$request_uuid = $data['request_id'] ?? $data['uuid'] ?? null;
$status = $data['status'] ?? null;
$result_url = $data['result_url'] ?? $data['generate_result'] ?? null;
$generation_type = $data['type'] ?? null;  // 'image', 'video', 'text'
$actual_credits_used = $data['used_credit'] ?? null;  // IMPORTANT: Actual GeminiGen usage

if (!$request_uuid) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing request_id']);
  exit;
}

// Determine status
$finalStatus = 'failed';
if ($status === 2 || $status === 'completed') {
  $finalStatus = 'completed';
} elseif ($status === 1 || $status === 'processing') {
  $finalStatus = 'pending';
}

// Update generation_logs table
$db = Database::getInstance();
$stmt = $db->prepare("
  UPDATE generation_logs
  SET
    status = ?,
    result_url = ?,
    actual_credits_used = ?,
    completed_at = NOW()
  WHERE request_uuid = ?
");
$stmt->execute([
  $finalStatus,
  $result_url,
  $actual_credits_used,  // Store actual GeminiGen usage
  $request_uuid
]);

// Store webhook data in file (for existing polling system)
$webhookDataDir = __DIR__ . '/../../v2/webhook-data/';
if (!is_dir($webhookDataDir)) {
  mkdir($webhookDataDir, 0755, true);
}

$webhookFile = $webhookDataDir . $request_uuid . '.json';
file_put_contents($webhookFile, json_encode($data));

// Return success
http_response_code(200);
echo json_encode(['success' => true]);
```

### Webhook URL Configuration
- **Single URL:** `https://automation.pillowpotion.com/api/webhook/receiver.php`
- All tools use this same webhook endpoint
- Backend distinguishes by `type` field in payload
- **Captures `used_credit` from GeminiGen response** to track actual API usage

---

## 🛠 NEW TOOLS TO BUILD

### Status of Tools

| Tool | Status | Action Required |
|------|--------|-----------------|
| **AI Youtube Story Generator** | ✅ Exists | Integrate with auth & credits |
| **Text to Video** | ❌ Does NOT exist | Build from scratch |
| **Text to Image** | ❌ Does NOT exist | Build from scratch |
| **History** | ⚠️ Partial (v2/history.html) | Move to /tools/history/ & enhance |

### 1. Text to Video Tool
**File:** `/public/tools/text-to-video/index.html`

**Functionality:**
- Single-page tool
- User inputs: Text prompt
- Model selection: Veo 2, Veo 3.1 Fast HD/FHD, Veo 3.1 HD/FHD
- Credit cost preview
- Generate button → calls GeminiGen video API
- Webhook polling for result
- Download button

**Credit Costs:**
- Veo 3.1 Fast HD/FHD: 2 credits
- Veo 2: 20 credits
- Veo 3.1 HD/FHD: 100 credits

**Implementation:**
```javascript
// Simplified flow
async function generateVideo() {
  const prompt = document.getElementById('prompt').value;
  const model = document.getElementById('model').value;

  // 1. Check credits
  const creditCheck = await checkCredits('video', model);
  if (!creditCheck.allowed) {
    showInsufficientCreditsModal(creditCheck);
    return;
  }

  // 2. Confirm cost
  if (!confirm(`This will use ${creditCheck.cost} credits. Continue?`)) {
    return;
  }

  // 3. Deduct credits
  await deductCredits('video', model, prompt);

  // 4. Call API
  const response = await fetch('/v2/api/generate-video.php', {
    method: 'POST',
    body: JSON.stringify({
      prompt: prompt,
      model: model,
      api_key: user.api_key
    })
  });

  const data = await response.json();
  const uuid = data.request_id;

  // 5. Poll webhook
  pollWebhookStatus(uuid, (result) => {
    displayVideo(result.result_url);
    updateCreditsDisplay();
  });
}
```

### 2. Text to Image Tool
**File:** `/public/tools/text-to-image/index.html`

**Functionality:**
- Single-page tool
- User inputs: Text prompt
- Model selection: Nano Banana, Imagen 4 Fast, Imagen 4 Ultra
- Credit cost preview
- Generate button → calls GeminiGen image API
- Display image
- Download button

**Credit Costs:**
- Nano Banana: 2 credits
- Imagen 4 Fast: 3 credits
- Imagen 4 Ultra: 5 credits

**Implementation:**
```javascript
// Simplified flow
async function generateImage() {
  const prompt = document.getElementById('prompt').value;
  const model = document.getElementById('model').value;

  // 1. Check credits
  const creditCheck = await checkCredits('image', model);
  if (!creditCheck.allowed) {
    showInsufficientCreditsModal(creditCheck);
    return;
  }

  // 2. Confirm cost
  if (!confirm(`This will use ${creditCheck.cost} credits. Continue?`)) {
    return;
  }

  // 3. Deduct credits
  await deductCredits('image', model, prompt);

  // 4. Call API
  const response = await fetch('/v2/api/generate-image.php', {
    method: 'POST',
    body: JSON.stringify({
      prompt: prompt,
      model: model,
      api_key: user.api_key
    })
  });

  const data = await response.json();
  const uuid = data.request_id;

  // 5. Poll webhook
  pollWebhookStatus(uuid, (result) => {
    displayImage(result.result_url);
    updateCreditsDisplay();
  });
}
```

### 3. Enhanced History Page
**File:** `/public/tools/history/index.html`

**Move from:** `/v2/history.html`

**Enhancements:**
- Show ALL generations (not just AI Youtube Story Generator)
- Filter by tool type (AI Story Generator, Text to Video, Text to Image)
- Filter by date range
- Filter by model
- **Show credits charged (fixed rate user paid)**
- Show API key used (last 4 chars)
- Show status (pending, completed, failed)
- Download buttons for completed generations
- Pagination (20 per page)

**Data Source:**
- `GET /api/user/history.php` → Returns all generation_logs for user

**Credit Display Logic:**
```javascript
// User sees ONLY our fixed pricing
if (userRole === 'user') {
  displayCredits = row.credits_charged;  // What we charged them
}

// Admin sees BOTH values
if (userRole === 'admin') {
  displayCredits = `${row.credits_charged} (actual: ${row.actual_credits_used || 'pending'})`;
  // Example: "2 (actual: 10)" shows we charged 2 but GeminiGen used 10
}
```

**Example Display (User View):**
```
| Date       | Tool      | Model        | Credits | Status    | API Key  |
|------------|-----------|--------------|---------|-----------|----------|
| 2025-01-15 | AI Story  | Veo 3.1 Fast | 2       | Completed | ••••ab12 |
| 2025-01-14 | Text→Img  | Imagen 4     | 3       | Completed | ••••ab12 |
```

**Example Display (Admin View):**
```
| Date       | Tool      | Model        | Charged | Actual | Profit | Status    | API Key  |
|------------|-----------|--------------|---------|--------|--------|-----------|----------|
| 2025-01-15 | AI Story  | Veo 3.1 Fast | 2       | 10     | -8     | Completed | ••••ab12 |
| 2025-01-14 | Text→Img  | Imagen 4     | 3       | 3      | 0      | Completed | ••••ab12 |
```

---

## 📧 EMAIL TEMPLATES

**File: `/app/services/EmailService.php`**

### 1. Email Verification
```
Subject: Verify your email - Script to Video Generator

Hi there,

Thanks for signing up! Click the link below to verify your email and receive 20 free credits:

https://automation.pillowpotion.com/verify-email.html?token={token}

This link expires in 24 hours.

Best,
The Script to Video Team
```

### 2. Welcome Email (After Verification)
```
Subject: 🎉 Your account is verified!

Hi {email},

Your account has been verified and we've added 20 free credits to your account!

You can now:
- Generate AI images
- Create AI videos
- Use all our tools

Get started: https://automation.pillowpotion.com/dashboard/

Best,
The Script to Video Team
```

### 3. Password Reset
```
Subject: Reset your password

Hi {email},

You requested a password reset. Click the link below to set a new password:

https://automation.pillowpotion.com/reset-password.html?token={token}

This link expires in 1 hour.

If you didn't request this, please ignore this email.

Best,
The Script to Video Team
```

### 4. Credits Approved (Admin → User)
```
Subject: Your credits have been added!

Hi {email},

Great news! Your credit request has been approved.

Plan: {plan_name}
Credits added: {credits}
New balance: {new_balance}

Start creating: https://automation.pillowpotion.com/dashboard/

Best,
The Script to Video Team
```

### 5. API Key Assigned (Admin → User)
```
Subject: Your API key has been assigned

Hi {email},

Your GeminiGen API key has been assigned:

API Key: {api_key}

You can view this anytime in your dashboard.

Best,
The Script to Video Team
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Foundation (Priority 1)
**Goal:** Get authentication & database working

**Tasks:**
1. Create database schema (run `init.sql`)
2. Set up folder structure (`/app`, `/public`, etc.)
3. Configure database connection (`/app/config/database.php`)
4. Configure JWT (`/app/config/jwt.php`)
5. Configure SMTP (`/app/config/email.php`)
6. Implement models (`User.php`, `Credit.php`, etc.)
7. Implement authentication controllers & services
8. Seed admin user
9. Create login/signup pages
10. Test authentication flow end-to-end

**Deliverable:** Users can signup, verify email, and login

---

### Phase 2: Credit System (Priority 2)
**Goal:** Credit deduction working

**Tasks:**
1. Implement `CreditService.php` with fixed cost mapping
2. Implement credit check API (`/api/credits/check.php`)
3. Implement credit deduction API (`/api/credits/deduct.php`)
4. Create `credits_ledger` logging
5. Create `generation_logs` tracking
6. Test credit deduction flow

**Deliverable:** Credits deducted correctly before generation

---

### Phase 3: User Dashboard (Priority 3)
**Goal:** Users can see their data

**Tasks:**
1. Create dashboard UI (`/public/dashboard/index.html`)
2. Implement dashboard API (`/api/user/dashboard.php`)
3. Create history page (`/dashboard/history.html`)
4. Create credits page (`/dashboard/credits.html`)
5. Implement credit request flow
6. Create profile page with API key display
7. Add logout functionality

**Deliverable:** Fully functional user dashboard

---

### Phase 4: Admin Dashboard (Priority 4)
**Goal:** Admin can manage users & credits

**Tasks:**
1. Create admin UI (`/public/admin/index.html`)
2. Implement admin APIs:
   - User management
   - Credit top-up
   - Request approval
   - API key assignment
3. Create user management page
4. Create credit requests page
5. Create generation logs page
6. Test admin workflows

**Deliverable:** Admin can approve requests & manage users

---

### Phase 5: Access Control (Priority 5)
**Goal:** Block tools before login

**Tasks:**
1. Implement middlewares (Auth, Admin, Credit)
2. Create `global-auth.js` for frontend protection
3. Add auth check to all tool pages (`/v2/*.html`)
4. Update `.htaccess` for routing
5. Test access restrictions

**Deliverable:** Tools blocked for unauthenticated users

---

### Phase 6: Tool Integration (Priority 6)
**Goal:** Integrate credit system with existing tools

**Tasks:**
1. Create API/Webhook validation popup (`/assets/js/api-webhook-validator.js`)
2. Modify `/v2/api-handler.js` to check/deduct credits
3. Add credit display to ALL tool page headers
4. Add cost preview modals
5. Update generation logging
6. Add "← Back to Tools" button to all v2 pages
7. Test full generation flow with credit deduction

**Deliverable:** AI Youtube Story Generator fully integrated with credit system

---

### Phase 7: New Tools Development (Priority 7)
**Goal:** Build Text to Video and Text to Image tools

**Tasks:**
1. Build Text to Video tool (`/tools/text-to-video/index.html`)
   - UI with prompt input & model selection
   - Credit check integration
   - GeminiGen API integration
   - Webhook polling
   - Download functionality
2. Build Text to Image tool (`/tools/text-to-image/index.html`)
   - UI with prompt input & model selection
   - Credit check integration
   - GeminiGen API integration
   - Webhook polling
   - Download functionality
3. Move & enhance History page (`/tools/history/index.html`)
   - Filter by tool type
   - Filter by date/model
   - Show credits used
   - Pagination
4. Add API/Webhook validation popup to both new tools
5. Test all three tools

**Deliverable:** All three tools functional

---

### Phase 8: Public Homepage (Priority 8)
**Goal:** Create landing page

**Tasks:**
1. Design & implement `/public/index.php`
2. Create pricing section (pull from `plans` table)
3. Add tools overview (3 tools)
4. Add features comparison
5. Add FAQ section
6. Link to login/signup

**Deliverable:** Professional SaaS landing page

---

### Phase 9: Polish & Testing (Priority 9)
**Goal:** Production-ready

**Tasks:**
1. Email template styling
2. Error handling refinement
3. Security audit (SQL injection, XSS, CSRF)
4. Mobile responsiveness (all pages)
5. Browser testing (Chrome, Firefox, Safari, Edge)
6. Performance optimization
7. Database backup strategy
8. Admin notification system testing
9. Single webhook endpoint testing (all tools)
10. API/Webhook validation popup refinement

**Deliverable:** Production-ready SaaS platform

---

## 📊 ADMIN CREDIT REQUEST WORKFLOW

### User Flow
```
User on Tools Page
  ↓
Clicks [Buy Credits] on any plan (e.g., Pro Creator - $50 / 3,000 credits)
  ↓
Modal opens:
  "Request Credits: Pro Creator Plan"
  Credits: 3,000
  Price: $50

  Optional: Payment proof upload

  [Submit Request]
  ↓
POST /api/user/request-credits.php
  - Insert into credit_requests table
  - status = 'pending'
  - Send email notification to admin
  ↓
User sees: "Request submitted! Admin will review and approve."
  ↓
User can view request status in Tools Page or Profile
```

### Admin Flow
```
Admin receives email: "New Credit Request from user@example.com"
  ↓
Admin logs into /admin/credit-requests.html
  ↓
Sees pending requests table:
  | User | Plan | Credits | Amount | Created | Actions |
  | user@example.com | Pro Creator | 3,000 | $50 | 2025-01-15 | [Approve] [Reject] |
  ↓
Admin clicks [Approve]
  ↓
Modal opens:
  "Approve Credit Request"

  User: user@example.com
  Requested Credits: 3,000
  Requested Amount: $50

  [Option 1: Use Requested Amount]
  → Top up 3,000 credits

  [Option 2: Custom Amount]
  → Credits to add: [input field]
  → Custom message to user: [textarea]
      (e.g., "We're giving you a bonus 500 credits for being our first customer!")

  [Confirm & Top Up]
  ↓
Backend (POST /api/admin/approve-request.php):
  1. Start transaction
  2. Update credit_requests.status = 'approved'
  3. Set approved_by = admin_id
  4. Add credits to user: UPDATE users SET credits = credits + {amount}
  5. Insert into credits_ledger:
       - amount = +{credits}
       - transaction_type = 'purchase' or 'admin_topup'
       - balance_after = new_balance
  6. Insert into admin_actions
  7. Commit transaction
  8. Send email to user:
       - If using requested amount: Standard template
       - If custom: Include admin's custom message
  ↓
User receives email with credits confirmation
  ↓
User's credit balance updated immediately
```

### Admin Custom Message Example
```
Admin approves request but adds 3,500 credits instead of 3,000:

Custom message:
"Thank you for your purchase! As a valued early adopter, we're adding a bonus 500 credits to your account. Enjoy creating!"

User receives:
---
Subject: Credits Added to Your Account

Hi user@example.com,

Thank you for your purchase! As a valued early adopter, we're adding a bonus 500 credits to your account. Enjoy creating!

Credits added: 3,500
New balance: 3,520 (had 20 free credits)

Start creating: https://automation.pillowpotion.com/tools/

Best,
The Script to Video Team
---
```

---

## 💰 DUAL CREDIT TRACKING SYSTEM (CRITICAL)

### Overview
The system tracks TWO different credit values:
1. **Fixed Credits Charged** - What WE charge users (our pricing)
2. **Actual Credits Used** - What GeminiGen API actually consumed

### Why This Matters
- **Business Model**: We charge fixed, predictable rates
- **Cost Tracking**: We need to know real API costs
- **Profit Analysis**: Compare what we charge vs what we pay

### Implementation Flow

**Step 1: When User Initiates Generation**
```php
// /api/credits/deduct.php
$fixed_cost = CreditService::getCostForModel($type, $model);
// Example: Veo 3.1 Fast = 2 credits (our fixed rate)

// Deduct from user balance
UPDATE users SET credits = credits - $fixed_cost WHERE id = ?;

// Log generation with FIXED cost
INSERT INTO generation_logs (
  user_id,
  api_key_used,
  generation_type,
  model,
  credits_charged,        // 2 (our fixed rate)
  actual_credits_used,    // NULL (not known yet)
  request_uuid,
  status
) VALUES (?, ?, ?, ?, ?, NULL, ?, 'pending');
```

**Step 2: When GeminiGen Webhook Arrives**
```php
// /api/webhook/receiver.php
$actual_credits = $data['used_credit'];  // e.g., 10 (real GeminiGen usage)

// Update with ACTUAL usage
UPDATE generation_logs
SET
  actual_credits_used = $actual_credits,  // 10 (real API cost)
  status = 'completed',
  result_url = ?,
  completed_at = NOW()
WHERE request_uuid = ?;
```

**Step 3: Display Based on Role**

**User History Page:**
```javascript
// GET /api/user/history.php
// Returns: credits_charged ONLY
{
  "generations": [
    {
      "model": "Veo 3.1 Fast",
      "credits": 2,  // Only show what we charged them
      "status": "completed"
    }
  ]
}
```

**Admin Logs Page:**
```javascript
// GET /api/admin/logs.php
// Returns: BOTH values
{
  "generations": [
    {
      "model": "Veo 3.1 Fast",
      "credits_charged": 2,         // What we charged
      "actual_credits_used": 10,    // What GeminiGen charged
      "profit_margin": -8,          // Loss of 8 credits
      "user_email": "user@example.com"
    }
  ]
}
```

### Admin Profit Dashboard

**File:** `/public/admin/profit-analysis.html`

**Metrics to Display:**
```sql
-- Total Profit/Loss
SELECT
  SUM(credits_charged) as total_charged,
  SUM(actual_credits_used) as total_actual,
  SUM(credits_charged - actual_credits_used) as total_profit
FROM generation_logs
WHERE status = 'completed';

-- Per-Model Analysis
SELECT
  model,
  COUNT(*) as generations,
  SUM(credits_charged) as charged,
  SUM(actual_credits_used) as actual,
  SUM(credits_charged - actual_credits_used) as profit,
  AVG(credits_charged - actual_credits_used) as avg_profit_per_gen
FROM generation_logs
WHERE status = 'completed'
GROUP BY model
ORDER BY profit DESC;

-- Per-User Profitability
SELECT
  u.email,
  COUNT(gl.id) as generations,
  SUM(gl.credits_charged) as charged,
  SUM(gl.actual_credits_used) as actual,
  SUM(gl.credits_charged - gl.actual_credits_used) as profit
FROM generation_logs gl
JOIN users u ON gl.user_id = u.id
WHERE gl.status = 'completed'
GROUP BY u.id
ORDER BY profit DESC;
```

**Example Admin Dashboard Display:**
```
┌─────────────────────────────────────────────────┐
│ 💰 Profit Margin Analysis                       │
├─────────────────────────────────────────────────┤
│ Total Credits Charged:    1,250                 │
│ Total Credits Used:       1,180                 │
│ Net Profit:              +70 credits            │
│ Profit Margin:           5.6%                   │
└─────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Model Performance                                             │
├─────────────┬────────┬─────────┬────────┬─────────┬──────────┤
│ Model       │ Gens   │ Charged │ Actual │ Profit  │ Margin   │
├─────────────┼────────┼─────────┼────────┼─────────┼──────────┤
│ Imagen 4    │ 100    │ 300     │ 300    │ 0       │ 0%       │
│ Veo 3.1 F   │ 50     │ 100     │ 500    │ -400    │ -400%❌  │
│ Nano Banana │ 200    │ 400     │ 380    │ +20     │ 5%✅     │
└─────────────┴────────┴─────────┴────────┴─────────┴──────────┘

⚠️ Models to Review:
- Veo 3.1 Fast: Losing money! Consider raising price.
```

### Security Note
**NEVER expose actual_credits_used to regular users.**
- Users should ONLY see what we charged them
- Actual costs are business-sensitive information
- Only admin role can access this data

### API Endpoint Responses

**/api/user/history.php** (User Role)
```json
{
  "success": true,
  "generations": [
    {
      "id": 123,
      "model": "Veo 3.1 Fast",
      "credits": 2,
      "status": "completed",
      "created_at": "2025-01-15"
    }
  ]
}
```

**/api/admin/logs.php** (Admin Role)
```json
{
  "success": true,
  "generations": [
    {
      "id": 123,
      "user_email": "user@example.com",
      "model": "Veo 3.1 Fast",
      "credits_charged": 2,
      "actual_credits_used": 10,
      "profit": -8,
      "status": "completed",
      "created_at": "2025-01-15"
    }
  ]
}
```

---

## 🔑 CRITICAL FILES TO MODIFY

| File | Type | Change Required |
|------|------|-----------------|
| `/v2/index.html` | Modify | Add auth check, credit display |
| `/v2/page2.html` | Modify | Add auth check, credit display |
| `/v2/page3.html` | Modify | Add auth check, credit display, cost preview |
| `/v2/page4.html` | Modify | Add auth check, credit display, cost preview |
| `/v2/page5.html` | Modify | Add auth check, credit display |
| `/v2/api-handler.js` | Modify | Add credit check/deduct before API calls |
| `/v2/state-manager.js` | Modify | Store user session data |
| `/.htaccess` | Modify | Add routing for auth pages |

---

## 🛡 SECURITY CHECKLIST

- [x] Passwords hashed with bcrypt (cost: 12)
- [x] JWT stored in HttpOnly cookies (not localStorage)
- [x] All admin routes protected by `AdminMiddleware`
- [x] All tool routes protected by `AuthMiddleware`
- [x] Credit deduction uses database transactions with row locking
- [x] Email verification required before awarding credits
- [x] Password reset tokens expire in 1 hour
- [x] SQL queries use prepared statements (PDO)
- [x] Input validation on all forms
- [x] CSRF protection (if using forms)
- [x] Rate limiting on auth endpoints (optional but recommended)
- [x] API key never exposed in frontend logs

---

## 📝 TESTING CHECKLIST

### Authentication
- [ ] Signup with valid email
- [ ] Signup with duplicate email (should fail)
- [ ] Email verification link works
- [ ] 20 credits awarded after verification
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Login before email verification (should fail)
- [ ] Password reset flow works
- [ ] Expired reset token rejected

### Credit System
- [ ] Credit check returns correct cost
- [ ] Insufficient credits blocks generation
- [ ] Credits deducted correctly after generation
- [ ] `credits_ledger` logs transaction
- [ ] `generation_logs` created
- [ ] Balance updated in real-time
- [ ] Admin can manually top-up credits
- [ ] Credit request approval works

### Access Control
- [ ] Homepage accessible without login
- [ ] Tools blocked before login
- [ ] Dashboard accessible after login
- [ ] Admin panel blocked for non-admin
- [ ] Admin panel accessible for admin
- [ ] Logout clears session

### Admin Functions
- [ ] Admin can view all users
- [ ] Admin can approve credit requests
- [ ] Admin can manually add/deduct credits
- [ ] Admin can assign API keys
- [ ] Admin can view generation logs
- [ ] `admin_actions` logs all admin operations

### Integration
- [ ] Full image generation flow with credit deduction
- [ ] Full video generation flow with credit deduction
- [ ] Generation logs updated after completion
- [ ] Credits display updates after each deduction
- [ ] History page shows past generations

---

## 🎯 SUCCESS CRITERIA

✅ Users can signup, verify email, and receive 20 free credits
✅ Users can login and access dashboard
✅ Tools blocked before login
✅ Credits deducted before each generation (fixed rates)
✅ Insufficient credits block generation
✅ Admin can approve credit requests
✅ Admin can manually manage credits
✅ Admin dashboard shows all user activity
✅ Public homepage accessible without login
✅ Email verification required before tool access
✅ Password reset works
✅ API keys assigned by admin
✅ Credit balance visible on all pages
✅ Generation history tracked in database

---

## 📊 FINAL ARCHITECTURE DIAGRAM

```
Public Access
  ├── Homepage (index.php) → Pricing, Tools overview, Signup/Login
  └── Auth Pages (login, signup, verify, reset)
        ↓
  [Authentication] → JWT + HttpOnly Cookie
        ↓
   ┌────────┴────────┐
   │                 │
User Role        Admin Role
   │                 │
   ├── Dashboard    ├── Admin Dashboard
   ├── History      ├── Users Management
   ├── Credits      ├── Credit Requests
   ├── Profile      ├── Generation Logs
   │                └── API Keys
   │
   └── Tools (/v2)
       ├── Credit Check (before generation)
       ├── Credit Deduct (after check)
       ├── Generate (existing API)
       └── Update Balance (real-time)
```

---

## 🔧 CONFIGURATION FILES NEEDED

### `/app/config/database.php`
```php
<?php
return [
  'host' => 'localhost',
  'database' => 'script_to_video',
  'username' => 'root',  // Update for production
  'password' => '',      // Update for production
  'charset' => 'utf8mb4'
];
```

### `/app/config/jwt.php`
```php
<?php
return [
  'secret' => 'GENERATE_RANDOM_256_BIT_SECRET',  // Change in production!
  'algorithm' => 'HS256',
  'expiry' => 86400,  // 24 hours
  'refresh_expiry' => 2592000  // 30 days
];
```

### `/app/config/email.php`
```php
<?php
return [
  'smtp_host' => 'smtp.gmail.com',
  'smtp_port' => 587,
  'smtp_username' => 'your-email@gmail.com',
  'smtp_password' => 'your-app-password',
  'from_email' => 'noreply@pillowpotion.com',
  'from_name' => 'Script to Video Generator'
];
```

---

END OF IMPLEMENTATION PLAN
