# Quick Reference: Session Management & Data Structure

## What Does "Manage Sessions" Mean?

**Session Management** = Keeping track of who is logged in and what they can access.

### Simple Explanation:
```
1. User logs in → Gets a "passport" (JWT token)
2. User carries passport → Shows it for protected access
3. Passport expires after 24 hours → Must login again
4. User logs out → Passport destroyed
```

### In Your App:
```javascript
// After login:
localStorage.token = "eyJhbGc..."  // The "passport"
localStorage.user = {name, email, ...}

// With every protected request:
headers: { Authorization: "Bearer eyJhbGc..." }

// After logout:
// Token and user removed from localStorage
```

---

## Firestore Data Structure (FINAL)

Every user document **MUST** have this exact structure:

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
  "createdAt": "2026-04-30T05:51:21",
  "updatedAt": "2026-04-30T05:51:21",
  "lastLogin": "2026-04-30T05:51:21"
}
```

### Critical Point: Phone Field

```
✅ CORRECT:  "phone": ""           (empty when not provided)
✅ CORRECT:  "phone": "+60123456"  (filled if user added it)
❌ WRONG:    "phone": "0000000000" (placeholder - don't use)
❌ WRONG:    "phone": null         (null - use empty string instead)
```

### Valid Value Examples

| Field | Valid Values | Example |
|-------|--------------|---------|
| `role` | "staff" OR "manager" | "staff" |
| `department` | "hr" OR "it" OR "finance" OR "marketing" | "finance" |
| `phone` | "" (empty) OR valid phone | "" or "+60123456789" |
| `active` | true OR false | true |
| `emailVerified` | true OR false | false |

---

## How Sessions Work (Step-by-Step)

### Step 1: User Registers
```
Form Input:
- Name: John Tan
- Email: johntan@gmail.com
- Department: finance
- Phone: (leave empty)
- Role: manager
- Password: MyPassword123

↓

Backend stores in Firestore:
{
  "id": "user_101",
  "name": "John Tan",
  "email": "johntan@gmail.com",
  "phone": "",              ← Empty (not provided)
  "role": "manager",
  "department": "finance",
  "password_hash": "$2b$12$...", (bcrypt hashed)
  ...
}
```

### Step 2: User Logs In
```
Login Form Input:
- Email: johntan@gmail.com
- Password: MyPassword123

↓

Backend:
1. Finds user by email
2. Verifies password with bcrypt
3. Creates JWT token: "eyJhbGc..."
4. Returns token + user data

↓

Frontend stores:
localStorage.token = "eyJhbGc..."
localStorage.user = {id, name, email, role, dept, ...}

↓

User is now in a SESSION (valid for 24 hours)
```

### Step 3: User Uses App
```
Every request to protected endpoint:
GET /api/user
  Authorization: Bearer eyJhbGc...

↓

Backend:
1. Checks Authorization header
2. Validates token signature
3. Checks if expired (24 hours)
4. If valid: Allow request
5. If invalid: Return 401 Unauthorized

↓

User can continue using app (session valid)
```

### Step 4: User Updates Profile
```
Update Form:
- Name: John Tan (unchanged)
- Phone: +60123456789 (filled)
- Department: it (changed)

↓

POST /api/profile with token

↓

Backend updates Firestore:
{
  ...
  "phone": "+60123456789",  ← Now has value
  "department": "it",       ← Updated
  "updatedAt": "2026-04-30T06:00:00"
}

↓

Frontend updates localStorage with new user data
```

### Step 5: Session Expires
```
After 24 hours:
- Token becomes invalid
- Next request with token fails: 401 Unauthorized
- Frontend catches error
- Redirects to /signin
- User must login again

↓

New login creates new token with new 24-hour expiration
```

### Step 6: User Logs Out
```
User clicks "Logout" button

↓

Frontend:
1. Calls POST /api/logout with token
2. Removes token from localStorage
3. Removes user from localStorage
4. Redirects to /signin

↓

Session ended immediately
User blocked from protected routes
```

---

## What Gets Saved Where?

### Firestore (Permanent Storage - Server)
```
Database: Firestore
Collection: userData
Data:
- User account info (id, name, email, role, department)
- Password hash (for verification)
- User preferences (avatar, active status)
- Timestamps (created, updated, lastLogin)

Persists: Forever (until deleted)
Access: Backend only (using Admin SDK)
```

### localStorage (Temporary Storage - Browser)
```
Storage: Browser localStorage
Data:
- JWT token (proves user is logged in)
- User object (name, email, role, etc.)

Persists: Until cleared or session expires
Access: Frontend only
Cleared on: Logout or manual delete
```

### In-Memory (Session Only)
```
Storage: Browser RAM
Data:
- Token decoded state
- User ID for current request

Persists: Only during page session
Access: Frontend JavaScript
Cleared on: Page refresh (reloaded from localStorage)
```

---

## Phone Field Implementation

### Current System

**Registration:**
```javascript
// Frontend
const payload = {
  name: formData.fullName,
  email: formData.email,
  password: formData.password,
  phone: formData.phone || "",  // Empty string if not provided
  role: formData.role,
  department: formData.department
};

// Backend accepts phone as empty string ""
```

**Login:**
```json
Response includes: "phone": ""  // (if empty)
```

**Profile Page:**
```javascript
If phone === "":
  Show: <input value="" />  // Empty input field
If phone has value:
  Show: <input value="+60123456" />  // With value
```

**Profile Update:**
```javascript
// User can:
1. Add phone (empty → "+60123456")
2. Change phone ("+60123456" → "+60987654")
3. Clear phone ("+60123456" → "")

// All changes saved to Firestore
```

---

## Summary Checklist

✅ **Sessions**: Users get a token when they login, lose it when they logout or after 24 hours
✅ **Phone Field**: Empty string "" when not provided, NOT placeholders
✅ **Data Structure**: All fields match Firestore schema exactly
✅ **Updates**: Profile changes immediately reflected in Firestore
✅ **Security**: Passwords hashed, tokens validated, sessions managed
✅ **User Flow**: Register → Login (get session) → Browse (use token) → Logout (end session)

---

## Files Created for Reference

1. `SESSION_MANAGEMENT.md` - Detailed session explanation
2. `FIRESTORE_DATA_STRUCTURE.md` - Full data schema documentation
3. `COMPLETE_AUTH_SYSTEM.md` - Complete system architecture
