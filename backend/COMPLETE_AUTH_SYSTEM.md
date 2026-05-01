# Complete Authentication & Session System Architecture

## System Overview

The KPI Tracker application implements a complete user authentication and session management system with secure JWT-based sessions and Firestore data persistence.

### Key Components

1. **Authentication System** (FastAPI Backend)
2. **Session Management** (JWT Tokens)
3. **User Data Storage** (Firebase Firestore)
4. **Frontend State Management** (React + localStorage)

---

## 1. AUTHENTICATION FLOW

### Registration Flow
```
User fills signup form
  ↓
Form sends data to POST /api/register
  ↓
Backend validates:
  - Required fields: name, email, password, role, department
  - Phone is optional (can be empty "")
  ↓
Backend creates user in Firestore:
  - Generates user_101, user_102, etc.
  - Hashes password with bcrypt
  - Auto-generates avatar from email
  ↓
Response sent to frontend (NO password_hash)
  ↓
Frontend shows "Account created! You can now log in"
  ↓
Redirects to /signin
```

### Login Flow
```
User enters email & password
  ↓
POST /api/login with credentials
  ↓
Backend retrieves user from Firestore
  ↓
Backend verifies password with bcrypt
  ↓
Backend creates JWT token:
  - Contains: user_id, email, expiration (24 hours)
  - Signed with SECRET_KEY
  ↓
Response includes:
  - JWT token
  - User object (NO password)
  - Dashboard URL (/manager/dashboard or /staff/dashboard)
  ↓
Frontend stores in localStorage:
  - localStorage.setItem('token', jwt_token)
  - localStorage.setItem('user', user_object)
  ↓
User redirected to dashboard
```

---

## 2. SESSION MANAGEMENT

### What is a Session?
A session is the period when a user is logged in and can access their account.

### How Sessions Work in This System

#### Session Creation
```javascript
// Frontend after login
localStorage.setItem('token', data.token);           // Store JWT
localStorage.setItem('user', JSON.stringify(data.user)); // Store user data
window.location.href = data.dashboard;              // Redirect
```

#### Session Validation (Protected Routes)
```python
# Backend for any protected endpoint
auth_header = request.headers.get('Authorization')
# Format: "Bearer <jwt_token>"

token = auth_header.split(' ', 1)[1]
decoded = verify_jwt_token(token)  # Verify signature & expiration
user_id = decoded.get('user_id')   # Extract user ID

# If valid: allow request
# If expired/invalid: return 401 Unauthorized
```

#### Session Continuation
```
User navigates around app
  ↓
Auth.jsx on mount:
  - Checks localStorage for token
  - If found: loads user data
  - Restores authentication state
  ↓
Token sent with every protected request:
  Authorization: Bearer <jwt_token>
  ↓
Session continues until:
  - Token expires (24 hours)
  - User clicks logout
  - Browser clears localStorage
```

#### Session Termination (Logout)
```javascript
// Frontend logout
localStorage.removeItem('token');
localStorage.removeItem('user');
window.location.href = '/signin';  // Redirect to login
```

### Session Lifetime
- **Valid for**: 24 hours from login
- **Expires**: Automatic (user must login again)
- **Logout**: Immediate (token removed)
- **Protection**: JWT signature prevents tampering

---

## 3. FIRESTORE DATA STRUCTURE

### User Document Schema

```json
{
  "id": "user_101",
  "name": "John Tan",
  "email": "johntan@gmail.com",
  "phone": "",
  "role": "staff",
  "department": "finance",
  "password_hash": "$2b$12$...",
  "avatar": "https://i.pravatar.cc/60?img=48",
  "assignedKpis": [],
  "teamIds": [],
  "active": true,
  "emailVerified": false,
  "createdAt": "2026-04-30T05:51:21.679421",
  "updatedAt": "2026-04-30T05:51:21.679425",
  "lastLogin": "2026-04-30T05:51:21.679421"
}
```

### Field Details

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | Yes | Auto-generated: user_101, user_102, etc. |
| `name` | string | Yes | User's full name |
| `email` | string | Yes | Unique email address |
| `phone` | string | No | **Empty string "" if not provided** |
| `role` | string | Yes | "staff" or "manager" |
| `department` | string | Yes | "hr", "it", "finance", "marketing" (lowercase) |
| `password_hash` | string | Yes | Bcrypt hashed (never sent to frontend) |
| `avatar` | string | Yes | Avatar URL |
| `assignedKpis` | array | Yes | List of KPI IDs |
| `teamIds` | array | Yes | List of team IDs |
| `active` | boolean | Yes | False if account deleted |
| `emailVerified` | boolean | Yes | Currently always false |
| `createdAt` | timestamp | Yes | Account creation time |
| `updatedAt` | timestamp | Yes | Last modified time |
| `lastLogin` | timestamp | No | Last login timestamp |

### Important Rules

#### Phone Field
```
✅ When user doesn't provide phone: phone = ""
✅ When user updates to empty: phone = ""
✅ When user adds phone: phone = "+60123456789"
❌ Never use: "0000000000", null, "N/A"
```

#### Department Field
```
✅ Valid values (lowercase): "hr", "it", "finance", "marketing"
✅ Selected during signup
✅ Can be changed in profile
❌ Never null or empty
```

#### Role Field
```
✅ Valid values: "staff" or "manager"
✅ Set during signup
❌ Should not change after signup
```

---

## 4. PROTECTED ENDPOINTS

Only requests with valid JWT token are accepted:

### GET /api/user
```
Purpose: Get current user data
Requires: Authorization: Bearer <token>
Response: 
{
  "success": true,
  "user": {...}
}
```

### PUT /api/profile
```
Purpose: Update profile (name, phone, department)
Requires: Authorization: Bearer <token>
Body: {
  "name": "New Name",           // optional
  "phone": "",                  // optional (can be empty)
  "department": "marketing"     // optional
}
Response: Updated user data
```

### PUT /api/password
```
Purpose: Change password
Requires: Authorization: Bearer <token>
Body: {
  "currentPassword": "old123",
  "newPassword": "new456",
  "confirmPassword": "new456"
}
```

### DELETE /api/profile
```
Purpose: Delete account permanently
Requires: Authorization: Bearer <token>
Response: Confirmation message
Effect: User document deleted from Firestore
```

### POST /api/logout
```
Purpose: Logout (invalidate session)
Requires: Authorization: Bearer <token>
Response: Confirmation message
Effect: Frontend removes token from localStorage
```

---

## 5. FRONTEND INTEGRATION

### Auth Context (Auth.jsx)
```javascript
// Provides authentication state to entire app
useAuth() hook:
  - user: Current user object
  - setUser: Update user state
  
On mount:
  - Checks localStorage for token
  - Loads user data if logged in
  - Sets up Auth provider for routes
```

### Protected Routes (Routes.jsx)
```javascript
// Routes that require authentication
- /profile
- /manager/dashboard
- /staff/dashboard
- etc.

If user not logged in:
  - Redirect to /signin
  - Show login form
```

### Local Storage (Client-Side Session)
```javascript
// Token (JWT) - proves user is authenticated
localStorage.getItem('token')

// User data - cached for quick display
localStorage.getItem('user')

// On logout: both are removed
```

---

## 6. SECURITY FEATURES

### Password Security
```
User password → bcrypt hashing → Stored in Firestore
                       ↓
When user logs in:
   Input password → bcrypt verify → Compare with hash
   ↓
   Match: Create JWT token
   No match: Return 401 error
```

### Token Security
```
JWT Token = Header . Payload . Signature
            ↓       ↓         ↓
            HS256   {data}    HMAC-SHA256(secret)

Cannot be forged (signature proves authenticity)
Cannot be modified (signature would be invalid)
Expires after 24 hours
```

### Additional Security
```
✅ Passwords hashed with bcrypt (not plain text)
✅ CORS enabled (frontend can only call backend from allowed origins)
✅ Tokens checked on every protected request
✅ Tokens expire automatically
✅ Users must re-login after expiration
```

---

## 7. COMPLETE USER JOURNEY

### New User
```
1. Visit /register
2. Fill form: name, email, role, department, phone (optional), password
3. Submit → POST /api/register
4. Backend creates user in Firestore with:
   - Auto-generated ID (user_101)
   - Bcrypt hashed password
   - Empty phone (if not provided)
   - Selected department
5. Success message → Redirect to /signin
6. User logs in
7. JWT token created
8. Redirect to dashboard
9. Session starts (24 hours)
```

### Returning User
```
1. Previous session: JWT token still in localStorage
2. Visit /profile (or any protected page)
3. Auth.jsx checks localStorage
4. Token loaded → User authenticated
5. Requests include: Authorization: Bearer <token>
6. Backend verifies token → Allows access
7. User can view/edit profile
```

### Session Expiration (After 24 Hours)
```
1. Token becomes invalid (expiration time passed)
2. Next request with expired token:
   → Backend rejects: 401 Unauthorized
   → Frontend catches error
   → Redirects to /signin
3. User must login again
4. New JWT token with new 24-hour expiration
```

### User Logout (Manual)
```
1. User clicks "Logout" button
2. Frontend calls POST /api/logout with token
3. Backend validates token and confirms logout
4. Frontend removes token from localStorage
5. Frontend removes user from localStorage
6. Redirect to /signin
7. All protected routes blocked
```

---

## 8. API SUMMARY

### Authentication Endpoints
```
POST /api/register      - Create new account
POST /api/login         - Login and get JWT token
POST /api/logout        - Logout and invalidate session
```

### User Profile Endpoints
```
GET /api/user           - Get current user (requires token)
PUT /api/profile        - Update profile (requires token)
PUT /api/password       - Change password (requires token)
DELETE /api/profile     - Delete account (requires token)
```

### Health Check
```
GET /api/health         - Server status
GET /api/users          - List all users (dev only)
```

---

## 9. ERROR HANDLING

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | No token or expired token | Login again |
| `400 Bad Request` | Missing required fields | Check form fields |
| `409 Conflict` | Email already registered | Use different email |
| `404 Not Found` | User doesn't exist | Check email |

---

## Summary

The system provides:
- ✅ Secure user registration
- ✅ Session-based authentication
- ✅ JWT token management
- ✅ Automatic session expiration
- ✅ Manual logout capability
- ✅ Protected endpoints
- ✅ Secure password storage
- ✅ Firestore persistence
- ✅ Frontend state management
- ✅ Clear error handling

All user data follows consistent Firestore structure with empty phone field (no placeholders), proper role/department values, and secure password hashing.
