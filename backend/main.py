from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import os
import bcrypt
import secrets
import jwt
from google.api_core.exceptions import AlreadyExists

# Import Firebase configuration
from firebase_secure import FIREBASE_CONFIG, FIREBASE_ADMIN_CONFIG, SERVICE_ACCOUNT_KEY_PATH, USERDATA_COLLECTION, USERAUTH_COLLECTION, USER_ROLES, print_config_status

app = FastAPI()

# Allow React (VERY IMPORTANT)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://bookish-zebra-7v5796xrxgj5cp64w-5173.app.github.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Print Firebase configuration status
print_config_status()

# Initialize Firebase Admin SDK
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
        firebase_admin.initialize_app(cred, FIREBASE_ADMIN_CONFIG)
    db = firestore.client()
    print("Firebase Admin SDK initialized successfully")
    print(f"Connected to project: {FIREBASE_ADMIN_CONFIG.get('projectId')}")
    print(f"Primary user data collection: {USERDATA_COLLECTION}")
except Exception as e:
    print(f"Firebase initialization error: {e}")
    print("Please ensure serviceAccountKey.json exists in the backend directory")
    db = None


# Pydantic models for request/response
class UserRegistration(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None  # Phone is optional
    role: str
    department: str


class UserLogin(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None  # Allow empty string
    department: Optional[str] = None


class PasswordUpdate(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str


class UserResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
    dashboard: Optional[str] = None
    requiresEmailVerification: Optional[bool] = False


USER_PROFILE_FIELDS = ("name", "email", "phone", "role", "department")


# Helper functions for password hashing and JWT
def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_jwt_token(user_id: str, email: str) -> str:
    """Create a JWT token for the user."""
    payload = {"user_id": user_id, "email": email, "exp": datetime.utcnow().timestamp() + (24 * 3600)}
    return jwt.encode(payload, "SECRET_KEY_CHANGE_IN_PROD", algorithm="HS256")


def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token."""
    return jwt.decode(token, "SECRET_KEY_CHANGE_IN_PROD", algorithms=["HS256"])


def build_user_profile_document(user_data: UserRegistration | dict) -> dict:
    """Create the exact Firestore profile document shape for a user."""
    return {
        "name": user_data["name"] if isinstance(user_data, dict) else user_data.name,
        "email": user_data["email"] if isinstance(user_data, dict) else user_data.email,
        "phone": (user_data["phone"] if isinstance(user_data, dict) else user_data.phone) or "",
        "role": user_data["role"] if isinstance(user_data, dict) else user_data.role,
        "department": user_data["department"] if isinstance(user_data, dict) else user_data.department,
    }


def build_public_user_document(user_id: str, user_profile: dict) -> dict:
    """Return the frontend-safe user shape with the generated user ID."""
    return {
        "id": user_id,
        **build_user_profile_document(user_profile),
    }


def save_user_profile_document(user_ref, user_profile: dict) -> None:
    """Overwrite a Firestore profile document with only the allowed fields."""
    user_ref.set(build_user_profile_document(user_profile))


def create_user_documents(users_ref, user_data: UserRegistration, hashed_password: str) -> tuple[str, dict]:
    """Create a brand-new user profile and auth record without overwriting existing documents."""
    base_profile = build_user_profile_document(user_data)
    attempt_number = 0

    while True:
        attempt_number += 1
        user_id = allocate_next_user_id(users_ref)
        user_ref = users_ref.document(user_id)
        auth_ref = db.collection(USERAUTH_COLLECTION).document(user_id)

        try:
            user_ref.create(base_profile)
            auth_ref.create({
                "userId": user_id,
                "email": user_data.email,
                "password_hash": hashed_password,
            })
            return user_id, base_profile
        except AlreadyExists:
            # ID was already taken; try again with the next candidate (do NOT delete existing docs)
            if attempt_number >= 10:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to allocate a new user ID after multiple attempts"
                )
            continue
        except Exception as e:
            # Non-AlreadyExists error during create: retry a few times, then fail
            if attempt_number >= 10:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed creating user documents: {str(e)}"
                )
            continue


def save_user_auth_document(user_id: str, email: str, password_hash: str) -> None:
    """Store password hashes outside of userData so profile docs stay clean."""
    db.collection(USERAUTH_COLLECTION).document(user_id).set({
        "userId": user_id,
        "email": email,
        "password_hash": password_hash,
    })


def get_user_auth_hash(user_id: str) -> str:
    """Load the password hash for a user from the auth collection."""
    auth_doc = db.collection(USERAUTH_COLLECTION).document(user_id).get()
    if not auth_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Authentication record not found")

    auth_data = auth_doc.to_dict() or {}
    return auth_data.get("password_hash", "")


def allocate_next_user_id(users_ref) -> str:
    """Allocate the next user ID using a transactional counter to guarantee sequential increment.

    This uses a Firestore document `systemCounters/userIdCounter` to atomically increment
    the `nextUserNumber` value so new signups receive sequential IDs (user_101, user_102...).
    If the counter doesn't exist yet we compute a safe starting point from existing user IDs.
    """
    @firestore.transactional
    def allocate_tx(transaction, users_ref_inner):
        counter_ref = db.collection(USER_COUNTER_COLLECTION).document(USER_COUNTER_DOC)
        counter_snapshot = counter_ref.get(transaction=transaction)

        if counter_snapshot.exists:
            counter_data = counter_snapshot.to_dict() or {}
            next_user_number = int(counter_data.get("nextUserNumber", 100)) + 1
        else:
            # Initialize counter from the highest existing user_ number
            existing_numbers = []
            for user_snapshot in users_ref_inner.stream():
                user_id = user_snapshot.id
                if not user_id.startswith("user_"):
                    continue
                try:
                    existing_numbers.append(int(user_id.split("_", 1)[1]))
                except (IndexError, ValueError):
                    continue

            next_user_number = (max(existing_numbers) if existing_numbers else 100) + 1

        transaction.set(counter_ref, {"nextUserNumber": next_user_number})
        return f"user_{next_user_number}"

    transaction = db.transaction()
    return allocate_tx(transaction, users_ref)


@app.get("/")
def root():
    return {"message": "KPI Tracker Backend API - use /api/* endpoints", "status": "ok"}


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    firebase_status = "connected" if db is not None else "not_configured"
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "firebase_connected": db is not None,
        "firebase_status": firebase_status,
        "service_account_key_exists": os.path.exists(SERVICE_ACCOUNT_KEY_PATH),
        "version": "1.0.0"
    }


@app.post("/api/register", response_model=UserResponse)
def register_user(user_data: UserRegistration):
    """Register a new user with Firestore (no Firebase Auth)"""
    try:
        # Validate required fields (phone is optional)
        required_fields = ['name', 'email', 'password', 'role', 'department']
        for field in required_fields:
            if not getattr(user_data, field):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing required field: {field}"
                )

        # Validate role
        if user_data.role not in ['staff', 'manager']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role must be 'staff' or 'manager'"
            )

        # Create user in Firestore with bcrypt password hash
        if db:
            print(f"Using Firestore for registration: {user_data.email}")
            try:
                # Check if user already exists in Firestore
                users_ref = db.collection(USERDATA_COLLECTION)
                existing_user = list(users_ref.where('email', '==', user_data.email).get())
                if existing_user:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )

                # Hash password
                hashed_password = hash_password(user_data.password)

                # Create fresh Firestore documents and never overwrite an existing user
                user_id, user_profile_doc = create_user_documents(users_ref, user_data, hashed_password)
                print(f"Created user in Firestore: {user_id}")

                # Return user data with the generated user ID
                user_response = build_public_user_document(user_id, user_profile_doc)

                return UserResponse(
                    success=True,
                    message="Registration successful! You can now log in.",
                    user=user_response,
                    requiresEmailVerification=False
                )

            except HTTPException:
                raise
            except Exception as firebase_error:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Firebase error: {str(firebase_error)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured. Please check your setup."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@app.post("/api/login")
def login_user(credentials: UserLogin):
    """Login user with role-based navigation using Firestore"""
    try:
        if not credentials.email or not credentials.password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required"
            )

        if db:
            print(f"Using Firestore for login: {credentials.email}")
            try:
                # Find user by email in Firestore
                users_ref = db.collection(USERDATA_COLLECTION)
                users = list(users_ref.where('email', '==', credentials.email).get())
                
                if not users:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid email or password"
                    )

                user_doc = users[0]
                user_id = user_doc.id
                user_data = user_doc.to_dict() or {}

                # Verify password from the dedicated auth collection
                password_hash = get_user_auth_hash(user_id)
                if not verify_password(credentials.password, password_hash):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid email or password"
                    )

                # Create JWT token
                token = create_jwt_token(user_id, credentials.email)

                # Determine dashboard based on role
                dashboard_url = "/staff/dashboard"
                if user_data.get('role') == 'manager':
                    dashboard_url = "/manager/dashboard"

                # Keep the userData document in the clean profile-only format
                save_user_profile_document(db.collection(USERDATA_COLLECTION).document(user_id), user_data)

                # Return user data with the generated user ID
                user_response = build_public_user_document(user_id, user_data)

                return {
                    "success": True,
                    "message": "Login successful!",
                    "user": user_response,
                    "dashboard": dashboard_url,
                    "token": token
                }

            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Login failed: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured. Please check your setup."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@app.post("/api/logout")
def logout_user(request: Request):
    """Logout user (JWT token is invalidated on client side by removing from localStorage)."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

        token = auth_header.split(' ', 1)[1]
        verify_jwt_token(token)  # Just verify the token is valid
        return {"success": True, "message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Logout failed: {str(e)}")


@app.get("/api/user")
def get_current_user(request: Request):
    """Get current user information by verifying JWT token in Authorization header."""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

        token = auth_header.split(' ', 1)[1]
        decoded = verify_jwt_token(token)
        user_id = decoded.get('user_id')

        if db:
            user_doc = db.collection(USERDATA_COLLECTION).document(user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict() or {}
                user_response = build_public_user_document(user_id, user_data)
                return {"success": True, "user": user_response}

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {str(e)}")


@app.get("/api/users")
def get_all_users():
    """Get all users (for development/testing)"""
    try:
        if db:
            users_ref = db.collection(USERDATA_COLLECTION)
            users = users_ref.stream()
            user_list = []

            for user in users:
                user_data = user.to_dict() or {}
                user_response = build_public_user_document(user.id, user_data)
                user_list.append(user_response)

            return {
                "success": True,
                "users": user_list
            }
        else:
            return {
                "success": False,
                "message": "Firebase/Firestore not configured. Cannot retrieve users."
            }

    except Exception as e:
        return {
            "success": False,
            "message": f"Failed to get users: {str(e)}"
        }


@app.post("/api/verify-email")
def send_verification_email(email: dict):
    """Send email verification link"""
    try:
        target_email = email.get('email')
        if not target_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")

        # In a real scenario, generate a verification link and send it
        return {"success": True, "message": "Verification email sent successfully"}
    except Exception as e:
        return {"success": False, "message": f"Failed to send verification email: {str(e)}"}


@app.get("/api/session")
def check_session(request: Request = None):
    """Check if user session is valid"""
    return {
        "success": True,
        "message": "Session is valid",
        "user": {
            "user_id": "user_123",
            "email": "john@example.com",
            "role": "staff"
        }
    }


@app.put("/api/profile")
def update_profile(profile_data: ProfileUpdate, request: Request):
    """Update user profile information (name, phone, department)"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

        token = auth_header.split(' ', 1)[1]
        decoded = verify_jwt_token(token)
        user_id = decoded.get('user_id')

        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        user_ref = db.collection(USERDATA_COLLECTION).document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Build update dict with only provided fields
        update_dict = {}
        if profile_data.name:
            update_dict["name"] = profile_data.name
        if profile_data.phone is not None:  # Allow empty string ""
            update_dict["phone"] = profile_data.phone
        if profile_data.department:
            update_dict["department"] = profile_data.department

        # Overwrite the document with only the approved profile fields
        updated_user = user_doc.to_dict() or {}
        updated_user.update(update_dict)
        save_user_profile_document(user_ref, updated_user)

        # Return updated user data
        updated_user = user_ref.get().to_dict() or {}
        user_response = build_public_user_document(user_id, updated_user)

        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": user_response
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )


@app.put("/api/password")
def update_password(password_data: PasswordUpdate, request: Request):
    """Update user password (verify current password, update with new one)"""
    try:
        # Validate password confirmation
        if password_data.newPassword != password_data.confirmPassword:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New passwords do not match"
            )

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

        token = auth_header.split(' ', 1)[1]
        decoded = verify_jwt_token(token)
        user_id = decoded.get('user_id')

        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        user_ref = db.collection(USERDATA_COLLECTION).document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user_data = user_doc.to_dict() or {}

        # Verify current password
        password_hash = get_user_auth_hash(user_id)
        if not verify_password(password_data.currentPassword, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )

        # Hash new password and update the auth record only
        new_password_hash = hash_password(password_data.newPassword)
        save_user_auth_document(user_id, user_data.get("email", ""), new_password_hash)

        return {
            "success": True,
            "message": "Password updated successfully",
            "user": build_public_user_document(user_id, user_data)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password update failed: {str(e)}"
        )


@app.delete("/api/profile")
def delete_account(request: Request):
    """Delete user account permanently from Firestore"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

        token = auth_header.split(' ', 1)[1]
        decoded = verify_jwt_token(token)
        user_id = decoded.get('user_id')

        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        user_ref = db.collection(USERDATA_COLLECTION).document(user_id)
        user_doc = user_ref.get()
        auth_ref = db.collection(USERAUTH_COLLECTION).document(user_id)

        if not user_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Permanently delete the user document from Firestore
        user_ref.delete()
        if auth_ref.get().exists:
            auth_ref.delete()
        print(f"Permanently deleted user from Firestore: {user_id}")

        return {
            "success": True,
            "message": "Account has been permanently deleted"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Account deletion failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
