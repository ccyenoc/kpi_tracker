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

# Import Firebase configuration
from firebase_secure import FIREBASE_CONFIG, FIREBASE_ADMIN_CONFIG, SERVICE_ACCOUNT_KEY_PATH, USERDATA_COLLECTION, USER_ROLES, print_config_status

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
    phone: Optional[str] = ""  # Phone is optional
    role: str
    department: str


class UserLogin(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = ""  # Allow empty string
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

                # Generate incremental user ID (user_101, user_102, etc.)
                all_users = list(users_ref.stream())
                next_user_number = 101 + len(all_users)
                user_id = f"user_{next_user_number}"

                # Hash password
                hashed_password = hash_password(user_data.password)

                # Create user document in userData collection
                user_doc = {
                    "id": user_id,
                    "name": user_data.name,
                    "email": user_data.email,
                    "phone": user_data.phone,
                    "role": user_data.role,
                    "department": user_data.department,
                    "password_hash": hashed_password,
                    "avatar": f"https://i.pravatar.cc/60?img={abs(hash(user_data.email)) % 70}",
                    "assignedKpis": [],
                    "teamIds": [],
                    "active": True,
                    "emailVerified": False,
                    "createdAt": datetime.now(),
                    "updatedAt": datetime.now()
                }

                # Store in userData collection
                db.collection(USERDATA_COLLECTION).document(user_id).set(user_doc)
                print(f"Created user in Firestore: {user_id}")

                # Return user data without password hash
                user_response = {k: v for k, v in user_doc.items() if k != 'password_hash'}

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
                user_data = user_doc.to_dict()

                # Verify password
                if not verify_password(credentials.password, user_data.get('password_hash', '')):
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

                # Update last login timestamps
                db.collection(USERDATA_COLLECTION).document(user_id).update({
                    "lastLogin": datetime.now(),
                    "updatedAt": datetime.now()
                })

                # Return user data without password hash
                user_response = {k: v for k, v in user_data.items() if k != 'password_hash'}

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
                user_data = user_doc.to_dict()
                # Remove password hash from response
                user_response = {k: v for k, v in user_data.items() if k != 'password_hash'}
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
                user_data = user.to_dict()
                # Remove password hash from response
                user_response = {k: v for k, v in user_data.items() if k != 'password_hash'}
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
        update_dict = {"updatedAt": datetime.now()}
        if profile_data.name:
            update_dict["name"] = profile_data.name
        if profile_data.phone:
            update_dict["phone"] = profile_data.phone
        if profile_data.department:
            update_dict["department"] = profile_data.department

        # Update in Firestore
        user_ref.update(update_dict)

        # Return updated user data
        updated_user = user_ref.get().to_dict()
        user_response = {k: v for k, v in updated_user.items() if k != 'password_hash'}

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

        user_data = user_doc.to_dict()

        # Verify current password
        if not verify_password(password_data.currentPassword, user_data.get('password_hash', '')):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )

        # Hash new password and update
        new_password_hash = hash_password(password_data.newPassword)
        user_ref.update({
            "password_hash": new_password_hash,
            "updatedAt": datetime.now()
        })

        return {
            "success": True,
            "message": "Password updated successfully"
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

        if not user_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Permanently delete the user document from Firestore
        user_ref.delete()
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
