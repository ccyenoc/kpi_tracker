# User Session Management

## What Does "Manage Sessions" Mean?

Session management is the system that keeps track of whether a user is logged in or logged out. It ensures:

### 1. **Authentication State Tracking**
   - **When User Signs In**: 
     - User enters email & password
     - Backend verifies credentials from Firestore
     - Backend creates a JWT token (unique identifier)
     - Token is sent to frontend and stored in localStorage
   
   - **While User is Logged In**:
     - Frontend stores the JWT token in localStorage
     - When user makes requests to protected endpoints (like /api/user, /api/profile), the token is sent in Authorization header
     - Backend verifies the token is valid before allowing access
     - This proves the user is still authenticated
   
   - **When User Signs Out / Logs Out**:
     - Frontend removes the token from localStorage
     - Session is terminated
     - User is redirected to login page
     - Making requests without token will fail

### 2. **Token-Based Sessions** (Current System)
   - **JWT Token**: A unique encoded string containing:
     - User ID
     - Email
     - Expiration time (24 hours)
     - Signature (proves token hasn't been tampered with)
   
   - **Example Flow**:
     ```
     Login Request → Backend verifies password → Creates JWT → Frontend stores token
     ↓
     Protected Request (e.g., GET /api/user) → Frontend sends token → Backend verifies token
     ↓
     If valid: Allow request | If invalid/expired: Reject request
     ```

### 3. **Security Features**
   - Tokens expire after 24 hours (automatic session timeout)
   - Tokens are only stored in brower memory (localStorage) or session storage
   - Password is hashed with bcrypt (never stored in plain text)
   - Each token is digitally signed (can't be forged)
   - Protected endpoints require valid token in Authorization header

### 4. **Session Lifecycle**

```
User Registration → User Login → Token Created → User Browsing (Token Valid)
                                      ↓
                          Auto Logout (24 hours)
                                      ↓
                            User Must Login Again
```

Or if user manually logs out:
```
User Registration → User Login → Token Created → User Clicks Logout
                                      ↓
                            Token Removed → Must Login Again
```

### 5. **Current Implementation in This Project**

| Component | Purpose |
|-----------|---------|
| **JWT Token** | Proves user is authenticated (sent with every protected request) |
| **localStorage** | Stores token + user data in browser |
| **Auth.jsx** | Manages authentication state (loads token on page load) |
| **Backend Routes** | Protected routes check token validity before allowing access |
| **24hr Expiration** | Session auto-expires, user must login again |

### 6. **Key Endpoints**

- `POST /api/register` - Create new account
- `POST /api/login` - Get JWT token (start session)
- `POST /api/logout` - End session (clear token)
- `GET /api/user` - Get current user (requires valid token)
- `PUT /api/profile` - Update profile (requires valid token)
- `PUT /api/password` - Change password (requires valid token)
- `DELETE /api/profile` - Delete account (requires valid token)

### 7. **Benefits of This Session System**

✅ Stateless (backend doesn't store session—just verifies tokens)
✅ Scalable (can handle many concurrent users)
✅ Secure (tokens are signed and time-limited)
✅ Mobile-friendly (works with any client)
✅ Automatic cleanup (expired tokens are invalid)
