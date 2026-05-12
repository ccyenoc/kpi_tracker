from fastapi import FastAPI, HTTPException, status, Request, UploadFile, File, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import FieldFilter
from datetime import datetime
import os
import bcrypt
import secrets
import jwt
import time
import smtplib
import hashlib
import re
from email.message import EmailMessage
from google.api_core.exceptions import AlreadyExists
import traceback
from pathlib import Path
import uuid



# Import Firebase configuration
from firebase_secure import FIREBASE_CONFIG, FIREBASE_ADMIN_CONFIG, SERVICE_ACCOUNT_KEY_PATH, USERDATA_COLLECTION, USERAUTH_COLLECTION, KPI_COLLECTION, USER_COUNTER_COLLECTION, USER_COUNTER_DOC, USER_ROLES, print_config_status

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


class EmailVerificationRequest(BaseModel):
    email: str


class EmailCodeVerificationRequest(BaseModel):
    email: str
    code: str


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


# ── KPI Pydantic models ────────────────────────────────────────────────────────

class KPICreate(BaseModel):
    """Payload for creating a new KPI (manager only)."""
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    target: Optional[float] = None          # numeric target value
    unit: Optional[str] = None              # e.g. "%", "units", "MYR"
    frequency: Optional[str] = None         # "daily" | "weekly" | "monthly"
    assignedTo: Optional[str] = None        # user_id of the staff member
    deadline: Optional[str] = None          # ISO-8601 date string


class KPIUpdate(BaseModel):
    """Payload for updating an existing KPI (manager only). All fields optional."""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target: Optional[float] = None
    unit: Optional[str] = None
    frequency: Optional[str] = None
    assignedTo: Optional[str] = None
    deadline: Optional[str] = None
    status: Optional[str] = None            # "active" | "inactive" | "completed"

# ──────────────────────────────────────────────────────────────────────────────


USER_PROFILE_FIELDS = ("name", "email", "phone", "role", "department")

EMAIL_VERIFICATION_COLLECTION = os.getenv("EMAIL_VERIFICATION_COLLECTION", "emailVerifications")
VERIFICATION_CODE_TTL_SECONDS = int(os.getenv("VERIFICATION_CODE_TTL_SECONDS", "600"))

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").strip().lower() in ("1", "true", "yes", "on")


def normalize_email(email: str) -> str:
    """Return canonical lower-cased email for comparisons and storage."""
    return (email or "").strip().lower()


def generate_verification_code() -> str:
    """Generate a random 6-digit code."""
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_verification_code(email: str, code: str, salt: str) -> str:
    """Hash verification code to avoid storing raw codes in Firestore."""
    payload = f"{normalize_email(email)}:{salt}:{code}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def is_email_registered_case_insensitive(target_email: str) -> bool:
    """Check if an email already exists in userData, case-insensitive."""
    if not db:
        return False

    normalized_target = normalize_email(target_email)
    users_ref = db.collection(USERDATA_COLLECTION)

    # Fast path for already normalized records.
    direct_matches = list(users_ref.where(filter=FieldFilter('email', '==', normalized_target)).stream())
    if direct_matches:
        return True

    # Backward-compatible scan for older mixed-case records.
    for user_snapshot in users_ref.stream():
        user_data = user_snapshot.to_dict() or {}
        if normalize_email(user_data.get("email", "")) == normalized_target:
            return True
    return False


def send_email_verification_message(target_email: str, verification_code: str) -> None:
    """Send verification code email through SMTP settings from environment variables."""
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD or not SMTP_FROM:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SMTP is not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM"
        )

    msg = EmailMessage()
    msg["Subject"] = "Your AchievePro verification code"
    msg["From"] = SMTP_FROM
    msg["To"] = target_email
    msg.set_content(
        "Use this verification code to complete your signup:\n\n"
        f"{verification_code}\n\n"
        f"This code expires in {VERIFICATION_CODE_TTL_SECONDS // 60} minutes."
    )

    try:
        if SMTP_USE_TLS and SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
            return

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            if SMTP_USE_TLS:
                server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}"
        )


def save_verification_code(email: str, code: str) -> int:
    """Store verification code hash with expiry for a normalized email."""
    if not db:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

    normalized_email = normalize_email(email)
    salt = secrets.token_hex(16)
    expires_at = int(time.time()) + VERIFICATION_CODE_TTL_SECONDS

    db.collection(EMAIL_VERIFICATION_COLLECTION).document(normalized_email).set({
        "email": normalized_email,
        "codeHash": hash_verification_code(normalized_email, code, salt),
        "codeSalt": salt,
        "expiresAt": expires_at,
        "verified": False,
        "createdAt": int(time.time()),
    })
    return expires_at


def email_is_verified(email: str) -> bool:
    """Return True if a valid verification record is marked as verified."""
    if not db:
        return False

    normalized_email = normalize_email(email)
    verification_doc = db.collection(EMAIL_VERIFICATION_COLLECTION).document(normalized_email).get()
    if not verification_doc.exists:
        return False

    verification_data = verification_doc.to_dict() or {}
    return bool(verification_data.get("verified", False))


def clear_email_verification(email: str) -> None:
    """Remove verification record after successful registration."""
    if not db:
        return
    normalized_email = normalize_email(email)
    db.collection(EMAIL_VERIFICATION_COLLECTION).document(normalized_email).delete()


# Helper functions for password hashing and JWT
def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_jwt_token(user_id: str, email: str) -> str:
    """Create a JWT token for the user."""
    payload = {"user_id": user_id, "email": email, "exp": time.time() + (24 * 3600)}
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
        print(f"[register] create_user_documents attempt {attempt_number} for email={getattr(user_data, 'email', None)}")
        user_id = allocate_next_user_id(users_ref)
        print(f"[register] candidate user_id={user_id}")
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
            print(f"[register] collision for {user_id} (AlreadyExists). Retrying...")
            if attempt_number >= 10:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to allocate a new user ID after multiple attempts"
                )
            continue
        except Exception as e:
            # Non-AlreadyExists error during create: log traceback, retry a few times, then fail
            print(f"[register] exception during create_user_documents attempt {attempt_number}: {e}")
            traceback.print_exc()
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
            try:
                next_user_number = int(counter_data.get("nextUserNumber", 100)) + 1
            except Exception as e:
                print(f"[allocate] invalid counter data: {counter_data}; error: {e}")
                traceback.print_exc()
                next_user_number = 101
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
        print(f"[allocate] counter set to nextUserNumber={next_user_number}")
        return f"user_{next_user_number}"

    transaction = db.transaction()
    try:
        return allocate_tx(transaction, users_ref)
    except Exception as e:
        print(f"[allocate] exception during allocate_tx: {e}")
        traceback.print_exc()
        raise


# ── Auth helper ───────────────────────────────────────────────────────────────

def require_manager(request: Request) -> dict:
    """Decode JWT and verify the caller is a manager. Returns the decoded token payload."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

    token = auth_header.split(" ", 1)[1]
    decoded = verify_jwt_token(token)
    user_id = decoded.get("user_id")

    if not db:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

    user_doc = db.collection(USERDATA_COLLECTION).document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user_data = user_doc.to_dict() or {}
    if user_data.get("role") != "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Manager access required")

    decoded["_user_data"] = user_data
    return decoded

# ──────────────────────────────────────────────────────────────────────────────


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
            field_value = getattr(user_data, field)
            if not field_value or (isinstance(field_value, str) and not field_value.strip()):
                print(f"[register] Missing or empty required field: {field} = '{field_value}'")
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

        # Normalize email for stable matching/storage.
        user_data.email = normalize_email(user_data.email)

        # Ensure email ownership is verified before allowing signup.
        if not email_is_verified(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is not verified. Please verify your email before signing up"
            )

        # Create user in Firestore with bcrypt password hash
        if db:
            print(f"Using Firestore for registration: {user_data.email}")
            try:
                # Check if user already exists in Firestore
                users_ref = db.collection(USERDATA_COLLECTION)
                if is_email_registered_case_insensitive(user_data.email):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )

                # Hash password
                hashed_password = hash_password(user_data.password)

                # Create fresh Firestore documents and never overwrite an existing user
                try:
                    user_id, user_profile_doc = create_user_documents(users_ref, user_data, hashed_password)
                except Exception as inner_e:
                    print(f"[register] exception while creating user documents: {inner_e}")
                    traceback.print_exc()
                    raise
                print(f"Created user in Firestore: {user_id}")

                # Return user data with the generated user ID
                user_response = build_public_user_document(user_id, user_profile_doc)

                # Remove one-time verification record after a successful signup.
                clear_email_verification(user_data.email)

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
                users = list(users_ref.where(filter=FieldFilter('email', '==', credentials.email)).stream())
                
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


@app.get("/api/debug/next-user-id")
def debug_next_user_id():
    """Return current counter doc, highest existing user_ number, and the next candidate ID (read-only).

    This endpoint is for diagnostics only and does not modify any Firestore state.
    """
    try:
        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        users_ref = db.collection(USERDATA_COLLECTION)
        counter_ref = db.collection(USER_COUNTER_COLLECTION).document(USER_COUNTER_DOC)

        # Load counter doc if present
        counter_snapshot = counter_ref.get()
        counter_data = counter_snapshot.to_dict() if counter_snapshot.exists else None

        # Find highest existing user_ number
        existing_numbers = []
        for user_snapshot in users_ref.stream():
            uid = user_snapshot.id
            if uid.startswith("user_"):
                try:
                    existing_numbers.append(int(uid.split("_", 1)[1]))
                except (IndexError, ValueError):
                    continue

        highest_existing = max(existing_numbers) if existing_numbers else None

        # Compute candidate without modifying the counter
        if counter_data:
            try:
                candidate_num = int(counter_data.get("nextUserNumber", 100)) + 1
            except Exception:
                candidate_num = (highest_existing or 100) + 1
        else:
            candidate_num = (highest_existing or 100) + 1

        candidate_id = f"user_{candidate_num}"

        return {
            "success": True,
            "counter": counter_data,
            "highest_existing": highest_existing,
            "next_candidate": candidate_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Debug failed: {str(e)}")


@app.post("/api/debug/init-user-counter")
def init_user_counter():
    """Initialize or repair `systemCounters/userIdCounter` to the highest existing `user_###`.

    This is a one-time administrative helper to avoid allocating IDs that collide with
    already existing user documents. It sets `nextUserNumber` to the highest existing
    numeric suffix (or 100 if none exist). The allocator will still increment on next use.
    """
    try:
        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        users_ref = db.collection(USERDATA_COLLECTION)
        counter_ref = db.collection(USER_COUNTER_COLLECTION).document(USER_COUNTER_DOC)

        # Compute highest existing user_ number
        existing_numbers = []
        for user_snapshot in users_ref.stream():
            uid = user_snapshot.id
            if uid.startswith("user_"):
                try:
                    existing_numbers.append(int(uid.split("_", 1)[1]))
                except (IndexError, ValueError):
                    continue

        highest_existing = max(existing_numbers) if existing_numbers else 100

        # Set the counter to highest_existing so next allocation returns highest_existing + 1
        counter_ref.set({"nextUserNumber": highest_existing})

        return {
            "success": True,
            "message": "Counter initialized/updated",
            "counter": {"nextUserNumber": highest_existing},
            "highest_existing": highest_existing,
            "next_candidate": f"user_{highest_existing + 1}"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Init counter failed: {str(e)}")


@app.post("/api/verify-email")
def send_verification_email(email_data: EmailVerificationRequest):
    """Generate and send a 6-digit verification code for signup email ownership."""
    try:
        target_email = normalize_email(email_data.email)
        if not target_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")

        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", target_email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email format")

        if is_email_registered_case_insensitive(target_email):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

        code = generate_verification_code()
        expires_at = save_verification_code(target_email, code)
        send_email_verification_message(target_email, code)

        return {
            "success": True,
            "message": "Verification code sent successfully",
            "expiresInSeconds": max(0, expires_at - int(time.time()))
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}"
        )


@app.post("/api/verify-code")
def verify_email_code(verification_data: EmailCodeVerificationRequest):
    """Validate a submitted verification code and mark email as verified."""
    try:
        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        target_email = normalize_email(verification_data.email)
        code = (verification_data.code or "").strip()

        if not target_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")
        if not re.match(r"^\d{6}$", code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code must be 6 digits")

        verification_ref = db.collection(EMAIL_VERIFICATION_COLLECTION).document(target_email)
        verification_doc = verification_ref.get()
        if not verification_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No verification code found for this email")

        doc_data = verification_doc.to_dict() or {}
        expires_at = int(doc_data.get("expiresAt", 0))
        if int(time.time()) > expires_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code expired")

        stored_salt = doc_data.get("codeSalt", "")
        stored_hash = doc_data.get("codeHash", "")
        candidate_hash = hash_verification_code(target_email, code, stored_salt)

        if not secrets.compare_digest(candidate_hash, stored_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

        verification_ref.set({
            "email": target_email,
            "verified": True,
            "verifiedAt": int(time.time()),
            "expiresAt": expires_at,
            "createdAt": doc_data.get("createdAt", int(time.time())),
        })

        return {"success": True, "message": "Email verified successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}"
        )


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


# ── Shared / read-only KPI endpoints (any authenticated user) ─────────────────

@app.get("/api/kpi")
def get_all_kpis():
    try:
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured"
            )

        docs = db.collection("kpis").stream()
        kpis = []

        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id
            kpis.append(data)

        return {
            "success": True,
            "kpis": kpis
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load KPIs: {str(e)}"
        )


@app.get("/api/kpi/submissions")
def get_kpi_submissions():
    try:
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured"
            )

        docs = db.collection("kpiSubmissions").stream()
        submissions = []

        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id
            submissions.append(data)

        return {
            "success": True,
            "submissions": submissions
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load KPI submissions: {str(e)}"
        )

"""View KPI"""
@app.get("/api/manager/kpi")
def manager_view_kpis(request: Request):
    decoded = require_manager(request)

    try:
        kpi_ref = db.collection(KPI_COLLECTION)
        query = kpi_ref

        # Read optional filters from query string
        assigned_to = request.query_params.get("assignedTo")
        kpi_status  = request.query_params.get("status")

        if assigned_to:
            query = query.where(filter=FieldFilter("assignedTo", "==", assigned_to))
        if kpi_status:
            query = query.where(filter=FieldFilter("status", "==", kpi_status))

        kpis = []
        for doc in query.stream():
            data = doc.to_dict() or {}
            data["id"] = doc.id
            kpis.append(data)

        return {"success": True, "kpis": kpis}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load KPIs: {str(e)}"
        )

"""View KPI"""
@app.get("/api/manager/kpi/{kpi_id}")
def manager_view_kpi(kpi_id: str, request: Request):
    decoded = require_manager(request)

    try:
        doc = db.collection(KPI_COLLECTION).document(kpi_id).get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KPI not found")

        data = doc.to_dict() or {}
        data["id"] = doc.id
        return {"success": True, "kpi": data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load KPI: {str(e)}"
        )

"""Set KPI"""
@app.post("/api/manager/kpi", status_code=status.HTTP_201_CREATED)
def manager_set_kpi(kpi_data: KPICreate, request: Request):
    
    decoded = require_manager(request)
    manager_id = decoded.get("user_id")

    try:
        now = datetime.utcnow().isoformat()
        doc_data = {
            "title":       kpi_data.title.strip(),
            "description": kpi_data.description or "",
            "category":    kpi_data.category or "",
            "target":      kpi_data.target,
            "unit":        kpi_data.unit or "",
            "frequency":   kpi_data.frequency or "",
            "assignedTo":  kpi_data.assignedTo or "",
            "deadline":    kpi_data.deadline or "",
            "status":      "active",
            "createdBy":   manager_id,
            "createdAt":   now,
            "updatedAt":   now,
        }

        new_ref = db.collection(KPI_COLLECTION).document()
        new_ref.set(doc_data)

        doc_data["id"] = new_ref.id
        return {"success": True, "message": "KPI created successfully", "kpi": doc_data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create KPI: {str(e)}"
        )

"""Update KPI"""
@app.put("/api/manager/kpi/{kpi_id}")
def manager_update_kpi(kpi_id: str, kpi_data: KPIUpdate, request: Request):
    decoded = require_manager(request)
    manager_id = decoded.get("user_id")

    try:
        kpi_ref = db.collection(KPI_COLLECTION).document(kpi_id)
        kpi_doc = kpi_ref.get()

        if not kpi_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KPI not found")

        update_fields: dict = {}
        for field, value in kpi_data.model_dump(exclude_unset=True).items():
            if value is not None:
                update_fields[field] = value

        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided to update"
            )

        update_fields["updatedAt"] = datetime.utcnow().isoformat()
        update_fields["updatedBy"] = manager_id

        kpi_ref.update(update_fields)

        # Return the full updated document
        updated_doc = kpi_ref.get().to_dict() or {}
        updated_doc["id"] = kpi_id
        return {"success": True, "message": "KPI updated successfully", "kpi": updated_doc}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update KPI: {str(e)}"
        )

"""Delete KPI"""
@app.delete("/api/manager/kpi/{kpi_id}")
def manager_delete_kpi(kpi_id: str, request: Request):
    decoded = require_manager(request)

    try:
        kpi_ref = db.collection(KPI_COLLECTION).document(kpi_id)
        kpi_doc = kpi_ref.get()

        if not kpi_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KPI not found")

        kpi_ref.delete()
        return {"success": True, "message": f"KPI '{kpi_id}' deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete KPI: {str(e)}"
        )


@app.get("/api/categories")
def get_categories():
    try:
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured"
            )

        docs = db.collection("categories").stream()
        categories = []

        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id
            categories.append(data)

        return {
            "success": True,
            "categories": categories
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load categories: {str(e)}"
        )


@app.get("/api/activity-logs")
def get_activity_logs():
    try:
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured"
            )

        docs = db.collection("activityLogs").stream()
        logs = []

        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id
            logs.append(data)

        return {
            "success": True,
            "activityLogs": logs
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load activity logs: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)
