# Firebase User Data Structure

## Expected Firestore User Document Structure

Every user in the `userData` collection should have this exact structure:

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
  "createdAt": "2026-04-30T05:51:21.679421+00:00",
  "updatedAt": "2026-04-30T05:51:21.679425+00:00",
  "lastLogin": "2026-04-30T05:52:28.012092+00:00"
}
```

## Field Definitions

| Field | Type | Required | Description | When Empty |
|-------|------|----------|-------------|-----------|
| `id` | string | Yes | Unique user ID (format: user_101, user_102, etc.) | Never |
| `name` | string | Yes | User's full name | Never |
| `email` | string | Yes | User's email address (unique) | Never |
| `phone` | string | No | User's phone number | Empty string `""` |
| `role` | string | Yes | Either "staff" or "manager" | Never |
| `department` | string | Yes | HR, IT, Finance, Marketing (lowercase) | Never |
| `password_hash` | string | Yes | Bcrypt hashed password (never plain text) | Never |
| `avatar` | string | Yes | Avatar URL from pravatar.cc | Auto-generated |
| `assignedKpis` | array | Yes | List of KPI IDs assigned to user | Empty array `[]` |
| `teamIds` | array | Yes | List of team IDs user belongs to | Empty array `[]` |
| `active` | boolean | Yes | Whether account is active (false if deleted) | Never |
| `emailVerified` | boolean | Yes | Whether email has been verified | Always false (for now) |
| `createdAt` | timestamp | Yes | When account was created | Auto timestamp |
| `updatedAt` | timestamp | Yes | When account was last modified | Auto timestamp |
| `lastLogin` | timestamp | No | When user last logged in | Auto timestamp on login |

## Important Rules

### ✅ Phone Field Rules
- If user doesn't provide phone during signup: `phone: ""`
- If user doesn't update phone in profile: Keep existing value
- If user clears phone: Set to `phone: ""`
- **Never** use placeholders like "0000000000" or "N/A"
- Phone is optional (can be empty)

### ✅ Department Field Rules
- Must be one of: `"hr"`, `"it"`, `"finance"`, `"marketing"` (lowercase)
- Selected during signup by user
- Can be updated in profile page
- Never empty or null

### ✅ Role Field Rules
- Must be either `"staff"` or `"manager"` (lowercase)
- Set during signup
- Should NOT be changed by users (protected)
- Never empty

### ✅ Timestamps
- `createdAt`: Set once at account creation, never changes
- `updatedAt`: Updated whenever any field changes (profile, password, etc.)
- `lastLogin`: Updated every time user logs in

### ✅ Password Hash
- Always hashed with bcrypt
- Never sent to frontend (except during registration response, then hidden)
- Never stored in plain text
- 24+ characters when hashed

## Example Firestore Documents

### Complete User (with phone)
```json
{
  "id": "user_101",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+60123456789",
  "role": "manager",
  "department": "it",
  "password_hash": "$2b$12$example...",
  "avatar": "https://i.pravatar.cc/60?img=15",
  "assignedKpis": ["kpi_001", "kpi_002"],
  "teamIds": ["team_01"],
  "active": true,
  "emailVerified": false,
  "createdAt": "2026-04-29T10:00:00",
  "updatedAt": "2026-04-30T14:30:00",
  "lastLogin": "2026-04-30T14:30:00"
}
```

### User Without Phone (CORRECT)
```json
{
  "id": "user_102",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "",
  "role": "staff",
  "department": "finance",
  "password_hash": "$2b$12$example...",
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

### ❌ INCORRECT Examples

**DON'T STORE LIKE THIS:**
```json
// ❌ Wrong: placeholder phone
"phone": "0000000000"

// ❌ Wrong: null instead of empty string
"phone": null

// ❌ Wrong: department not lowercase
"department": "Finance"

// ❌ Wrong: password in plain text
"password": "MyPassword123"

// ❌ Wrong: missing required fields
{ "name": "John", "email": "john@example.com" }
```

## Frontend Display Rules

When displaying user data on ProfilePage:
- If `phone === ""`: Show empty input field (no placeholder)
- If `phone` has value: Show in input field
- Department dropdown should have value matching lowercase from Firestore
- Name and email shown from Firestore

## Data Flow

```
Frontend Signup Form
        ↓
Validate: name, email, password, role, department required
          phone optional (can be empty)
        ↓
POST /api/register
        ↓
Backend validates structure
        ↓
Store in Firestore with all fields
        ↓
Return to frontend (minus password_hash)
        ↓
Frontend stores in localStorage
        ↓
User logs in/navigates
        ↓
Auth loads from localStorage
        ↓
ProfilePage displays with proper structure
```
