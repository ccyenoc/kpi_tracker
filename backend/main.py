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



# import firebase configuration
from firebase_secure import FIREBASE_CONFIG, FIREBASE_ADMIN_CONFIG, SERVICE_ACCOUNT_KEY_PATH, USERDATA_COLLECTION, USERAUTH_COLLECTION, USER_COUNTER_COLLECTION, USER_COUNTER_DOC, USER_ROLES, print_config_status
from manager_service import KPIAssignmentService, SubmissionVerificationService, KPIReportService, KPIPredictionService, AssignKPIRequest, VerifySubmissionRequest

app = FastAPI()

# allow react
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://bookish-zebra-7v5796xrxgj5cp64w-5173.app.github.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Collection name constants ──────────────────────────────────────────────────
# FIX: KPI_COLLECTION was referenced in manager endpoints but never defined,
# causing "name 'KPI_COLLECTION' is not defined" at runtime.
KPI_COLLECTION = "kpiData"
# ──────────────────────────────────────────────────────────────────────────────

# print firebase configuration status
print_config_status()

# initialize firebase admin SDK
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


# models for request/response
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

# ── Submission action models ───────────────────────────────────────────────────
class SubmissionActionRequest(BaseModel):
    """Payload for approve/return actions from verify-kpi.jsx."""
    note: Optional[str] = None
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

    # fast path for already normalized records.
    direct_matches = list(users_ref.where(filter=FieldFilter('email', '==', normalized_target)).stream())
    if direct_matches:
        return True

    # backward-compatible scan for older mixed-case records.
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


# helper functions for password hashing and JWT
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
            # id was already taken; try again with the next candidate 
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
    """Allocate the next user ID using a transactional counter to guarantee sequential increment."""
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
    return {"message": "AchievePro API is running"}


@app.post("/api/login")
def login_user(credentials_data: UserLogin):
    try:
        if db:
            users_ref = db.collection(USERDATA_COLLECTION)
            normalized_email = normalize_email(credentials_data.email)

            # find user by normalized email
            user_query = list(users_ref.where(filter=FieldFilter('email', '==', normalized_email)).stream())

            if not user_query:
                # fallback: scan for mixed-case legacy records
                for user_snapshot in users_ref.stream():
                    user_data = user_snapshot.to_dict() or {}
                    if normalize_email(user_data.get("email", "")) == normalized_email:
                        user_query = [user_snapshot]
                        break

            if not user_query:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )

            user_doc = user_query[0]
            user_id = user_doc.id
            user_data = user_doc.to_dict() or {}

            try:
                password_hash = get_user_auth_hash(user_id)
            except HTTPException:
                raise

            if not verify_password(credentials_data.password, password_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )

            token = create_jwt_token(user_id, user_data.get("email", ""))
            dashboard_url = "/staff/dashboard"

            if user_data.get('role') == 'manager':
                dashboard_url = "/manager/dashboard"

            save_user_profile_document(db.collection(USERDATA_COLLECTION).document(user_id), user_data)
            user_response = build_public_user_document(user_id, user_data)

            return {
                "success": True,
                "message": "Login successful!",
                "user": user_response,
                "dashboard": dashboard_url,
                "token": token
            }

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
        verify_jwt_token(token)
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


@app.get("/api/manager/staff")
def get_staff_users(request: Request):
    """Get all users for staff assignment (manager only, requires JWT)."""
    decoded = require_manager(request)
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firebase not configured")
        user_list = []
        for user in db.collection(USERDATA_COLLECTION).stream():
            user_data = user.to_dict() or {}
            user_list.append(build_public_user_document(user.id, user_data))
        return {"success": True, "users": user_list}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get staff: {str(e)}")


@app.get("/api/users")
def get_all_users(request: Request):
    """Get all users (for manager staff assignment)"""
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


@app.get("/api/users/{user_id}")
def get_user_by_id(user_id: str, request: Request):
    """Get a single user by ID (used by verify-kpi.jsx to resolve submittedBy name)."""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")

        token = auth_header.split(" ", 1)[1]
        verify_jwt_token(token)

        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        user_doc = db.collection(USERDATA_COLLECTION).document(user_id).get()
        if not user_doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user_data = user_doc.to_dict() or {}
        return {"success": True, "user": build_public_user_document(user_id, user_data)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to get user: {str(e)}")


@app.get("/api/debug/next-user-id")
def debug_next_user_id():
    """Return current counter doc, highest existing user_ number, and the next candidate ID (read-only)."""
    try:
        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        users_ref = db.collection(USERDATA_COLLECTION)
        counter_ref = db.collection(USER_COUNTER_COLLECTION).document(USER_COUNTER_DOC)

        counter_snapshot = counter_ref.get()
        counter_data = counter_snapshot.to_dict() if counter_snapshot.exists else None

        existing_numbers = []
        for user_snapshot in users_ref.stream():
            uid = user_snapshot.id
            if uid.startswith("user_"):
                try:
                    existing_numbers.append(int(uid.split("_", 1)[1]))
                except (IndexError, ValueError):
                    continue

        highest_existing = max(existing_numbers) if existing_numbers else None

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
    """Initialize or repair systemCounters/userIdCounter to the highest existing user_###."""
    try:
        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        users_ref = db.collection(USERDATA_COLLECTION)
        counter_ref = db.collection(USER_COUNTER_COLLECTION).document(USER_COUNTER_DOC)

        existing_numbers = []
        for user_snapshot in users_ref.stream():
            uid = user_snapshot.id
            if uid.startswith("user_"):
                try:
                    existing_numbers.append(int(uid.split("_", 1)[1]))
                except (IndexError, ValueError):
                    continue

        highest_existing = max(existing_numbers) if existing_numbers else 100
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

        update_dict = {}
        if profile_data.name:
            update_dict["name"] = profile_data.name
        if profile_data.phone is not None:
            update_dict["phone"] = profile_data.phone
        if profile_data.department:
            update_dict["department"] = profile_data.department

        updated_user = user_doc.to_dict() or {}
        updated_user.update(update_dict)
        save_user_profile_document(user_ref, updated_user)

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

        password_hash = get_user_auth_hash(user_id)
        if not verify_password(password_data.currentPassword, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )

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
    # FIX: was reading from "kpis" collection — changed to KPI_COLLECTION ("kpiData")
    # to match the Firestore collection where data actually lives.
    try:
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured"
            )

        docs = db.collection(KPI_COLLECTION).stream()
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


@app.get("/api/kpi/{kpi_id}")
def get_kpi_by_id(kpi_id: str, request: Request):
    """Get a single KPI by ID (used by verify-kpi.jsx)."""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Authorization header")
        token = auth_header.split(" ", 1)[1]
        verify_jwt_token(token)

        if not db:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Firebase not configured")

        doc = db.collection(KPI_COLLECTION).document(kpi_id).get()
        if not doc.exists:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KPI not found")

        data = doc.to_dict() or {}
        data["id"] = doc.id
        return {"success": True, "kpi": data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to load KPI: {str(e)}")


"""View KPI"""
@app.get("/api/manager/kpi")
def manager_view_kpis(request: Request):
    decoded = require_manager(request)

    try:
        kpi_ref = db.collection(KPI_COLLECTION)
        query = kpi_ref

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


"""View single KPI (manager)"""
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

        docs = db.collection("categoriesData").stream()
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


@app.post("/api/kpi/update")
async def staff_update_kpi_progress(
    request: Request,
    kpiId: str = Form(...),
    current: float = Form(...),
    notes: str = Form(""),
    files: List[UploadFile] = File(default=[]),
):
    """Staff submits KPI progress update with optional file evidence."""
    try:
        # Get user from JWT
        auth_header = request.headers.get("Authorization", "")
        user_id = "unknown"
        if auth_header.startswith("Bearer "):
            try:
                decoded = verify_jwt_token(auth_header.split(" ", 1)[1])
                user_id = decoded.get("user_id", "unknown")
            except Exception:
                pass

        if not db:
            raise HTTPException(status_code=500, detail="Firebase not configured")

        # Save uploaded files
        UPLOAD_DIR = Path("uploads")
        UPLOAD_DIR.mkdir(exist_ok=True)

        saved_files = []
        file_names = []
        for f in files:
            if f.filename:
                uid_prefix = str(uuid.uuid4())
                stored_name = f"{uid_prefix}_{f.filename}"
                file_path = UPLOAD_DIR / stored_name
                contents = await f.read()
                file_path.write_bytes(contents)
                saved_files.append({
                    "originalName": f.filename,
                    "storedName": stored_name,
                    "path": str(file_path),
                })
                file_names.append(f.filename)

        # Create submission document
        now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        submission_data = {
            "kpiId": kpiId,
            "submittedBy": user_id,
            "current": current,
            "notes": notes,
            "files": saved_files,
            "fileNames": file_names,
            "status": "pending",
            "submittedAt": now_str,
        }

        submission_ref = db.collection("kpiSubmissions").document()
        submission_ref.set(submission_data)
        submission_data["id"] = submission_ref.id

        return {"success": True, "submission": submission_data}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit KPI update: {str(e)}")


@app.get("/api/kpi/{kpi_id}/prediction")
def get_kpi_prediction_staff(kpi_id: str):
    """Get predicted KPI outcome — accessible by both staff and managers."""
    try:
        result = KPIPredictionService.predict_kpi_outcome(kpi_id)
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get prediction: {str(e)}")


@app.get("/api/manager/dashboard/stats")
def get_manager_dashboard_stats(request: Request):
    """Return aggregated stats for the manager dashboard (KPIs, staff rankings, underperforming)."""
    decoded = require_manager(request)
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firebase not configured")

        kpi_docs = list(db.collection(KPI_COLLECTION).stream())
        kpis = []
        for doc in kpi_docs:
            d = doc.to_dict() or {}
            d["id"] = doc.id
            kpis.append(d)

        submission_docs = list(db.collection("kpiSubmissions").stream())
        submissions = [dict({"id": d.id}, **d.to_dict()) for d in submission_docs]

        # Staff performance aggregation
        staff_scores: dict = {}
        for kpi in kpis:
            for assignment in kpi.get("kpiAssignments", []):
                uid = assignment.get("userId")
                if not uid:
                    continue
                target = assignment.get("target", 1) or 1
                current = assignment.get("current", 0)
                pct = round((current / target) * 100, 1)
                if uid not in staff_scores:
                    # Fetch user name
                    u_doc = db.collection(USERDATA_COLLECTION).document(uid).get()
                    u_data = u_doc.to_dict() or {} if u_doc.exists else {}
                    staff_scores[uid] = {
                        "staffId": uid,
                        "name": u_data.get("name", uid),
                        "department": u_data.get("department", ""),
                        "totalTarget": 0,
                        "totalCurrent": 0,
                        "kpiCount": 0,
                    }
                staff_scores[uid]["totalTarget"] += target
                staff_scores[uid]["totalCurrent"] += current
                staff_scores[uid]["kpiCount"] += 1

        rankings = []
        underperforming = []
        for uid, s in staff_scores.items():
            pct = round((s["totalCurrent"] / s["totalTarget"]) * 100, 1) if s["totalTarget"] else 0
            entry = {**s, "achievementRate": pct}
            rankings.append(entry)
            if pct < 50:
                underperforming.append(entry)

        rankings.sort(key=lambda x: x["achievementRate"], reverse=True)

        return {
            "success": True,
            "kpis": kpis,
            "staffRankings": rankings[:10],
            "underperformingKpis": [k for k in kpis if k.get("status") not in ("completed",) and
                                     any((a.get("current", 0) / (a.get("target", 1) or 1)) < 0.5
                                         for a in k.get("kpiAssignments", []))],
            "submissions": submissions,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard stats failed: {str(e)}")


@app.get("/api/manager/dashboard/monthly-performance")
def get_monthly_performance(request: Request):
    """
    Aggregate approved KPI submissions by month to power the Monthly Performance graph.

    Returns a list of objects shaped as:
        { time: "Jan", kpi: <avg assigned target>, progress: <avg approved progress>, prediction: <projected> }

    Algorithm:
    - Load all KPI assignments to get per-user targets.
    - Load all *approved* submissions, group by month (submittedAt[:7] → YYYY-MM).
    - For each month: average the `current` values reported in submissions and the
      corresponding assignment targets so the graph shows meaningful percentages.
    - Derive a simple linear prediction for months that have no submissions yet.
    """
    require_manager(request)

    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firebase not configured")

        MONTH_ABBR = {
            "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
            "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
            "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
        }

        # ── 1. Load all KPIs and build a target lookup {kpi_id: {user_id: target}} ──
        kpi_docs = list(db.collection(KPI_COLLECTION).stream())
        kpi_target_map: dict[str, dict] = {}  # kpi_id → {userId: target}
        for doc in kpi_docs:
            d = doc.to_dict() or {}
            assignments = d.get("kpiAssignments", [])
            kpi_target_map[doc.id] = {
                a.get("userId"): a.get("target", 0)
                for a in assignments
                if a.get("userId")
            }

        # ── 2. Load approved submissions ──────────────────────────────────────────
        approved_docs = (
            db.collection("kpiSubmissions")
            .where(filter=FieldFilter("status", "==", "approved"))
            .stream()
        )

        # month_data[month_key] = {"progress_sum": float, "target_sum": float, "count": int}
        month_data: dict[str, dict] = {}

        for doc in approved_docs:
            s = doc.to_dict() or {}
            submitted_at: str = s.get("submittedAt", "")
            if not submitted_at or len(submitted_at) < 7:
                continue

            # submittedAt is stored as "YYYY-MM-DD HH:MM:SS" or ISO string
            month_key = submitted_at[:7]  # "YYYY-MM"
            kpi_id = s.get("kpiId", "")
            user_id = s.get("submittedBy", "")
            current = float(s.get("current", 0))

            # Look up the target for this user on this KPI
            target = float(
                kpi_target_map.get(kpi_id, {}).get(user_id, 0)
            )
            if target <= 0:
                # Fall back to KPI-level target_kpi field if stored there
                for d2 in kpi_docs:
                    if d2.id == kpi_id:
                        target = float((d2.to_dict() or {}).get("target", 1) or 1)
                        break

            if month_key not in month_data:
                month_data[month_key] = {"progress_sum": 0, "target_sum": 0, "count": 0}

            month_data[month_key]["progress_sum"] += current
            month_data[month_key]["target_sum"] += target
            month_data[month_key]["count"] += 1

        # ── 3. Build sorted result list ───────────────────────────────────────────
        sorted_months = sorted(month_data.keys())  # chronological

        result = []
        for mk in sorted_months:
            md = month_data[mk]
            _, mm = mk.split("-", 1)
            month_label = MONTH_ABBR.get(mm, mk)

            target_avg = md["target_sum"] / md["count"] if md["count"] else 0
            progress_avg = md["progress_sum"] / md["count"] if md["count"] else 0
            # Prediction: linear extrapolation — if we maintain current rate for full period
            progress_rate = (progress_avg / target_avg) if target_avg > 0 else 0
            prediction = round(min(target_avg, target_avg * progress_rate * 1.05), 2)

            result.append({
                "time": month_label,
                "kpi": round(target_avg, 2),
                "progress": round(progress_avg, 2),
                "prediction": prediction,
                "month": month_label,
            })

        # If no approved submissions yet, return an empty-state placeholder so
        # the chart renders without crashing.
        if not result:
            result = [{"time": "No data", "kpi": 0, "progress": 0, "prediction": 0, "month": "No data"}]

        return {"success": True, "monthlyPerformance": result}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Monthly performance failed: {str(e)}")


@app.get("/api/activity-logs")
def get_activity_logs():
    try:
        if not db:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Firebase/Firestore not configured"
            )

        docs = db.collection("activityLog").stream()
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


# ── Submission approve/return endpoints (used by verify-kpi.jsx) ──────────────

@app.post("/api/kpi/submissions/{submission_id}/approve")
def approve_submission(submission_id: str, body: SubmissionActionRequest, request: Request):
    """Approve a KPI submission. Wraps SubmissionVerificationService.verify_submission."""
    decoded = require_manager(request)
    manager_id = decoded.get("user_id")

    submission_doc = db.collection("kpiSubmissions").document(submission_id).get()
    if not submission_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    kpi_id = submission_doc.to_dict().get("kpiId", "")
    result = SubmissionVerificationService.verify_submission(
        submission_id, kpi_id, "approved", body.note or "", manager_id
    )

    if not result["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["message"])

    return result


@app.post("/api/kpi/submissions/{submission_id}/return")
def return_submission(submission_id: str, body: SubmissionActionRequest, request: Request):
    """Return a KPI submission for revision. Wraps SubmissionVerificationService.verify_submission."""
    decoded = require_manager(request)
    manager_id = decoded.get("user_id")

    submission_doc = db.collection("kpiSubmissions").document(submission_id).get()
    if not submission_doc.exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")

    kpi_id = submission_doc.to_dict().get("kpiId", "")
    result = SubmissionVerificationService.verify_submission(
        submission_id, kpi_id, "rejected", body.note or "", manager_id
    )

    if not result["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["message"])

    return result

# ──────────────────────────────────────────────────────────────────────────────


# MANAGER MODULE ENDPOINTS 

@app.post("/api/manager/kpi/assign-staff")
def assign_kpi_to_staff(request: AssignKPIRequest, req: Request):
    """Assign KPI to multiple staff members with individual targets"""
    try:
        manager_id = req.headers.get("X-User-ID", "system")
        result = KPIAssignmentService.assign_kpi_to_staff(
            request.kpiId,
            request.assignments,
            manager_id
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign KPI to staff: {str(e)}"
        )


@app.get("/api/manager/kpi/{kpi_id}/assignments")
def get_kpi_assignments(kpi_id: str):
    """Get all staff assignments for a specific KPI"""
    try:
        result = KPIAssignmentService.get_kpi_assignments(kpi_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["message"]
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get KPI assignments: {str(e)}"
        )


@app.get("/api/manager/submissions/pending")
def get_pending_submissions(kpi_id: Optional[str] = None):
    """Get all pending submissions for manager verification"""
    try:
        result = SubmissionVerificationService.get_pending_submissions(kpi_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pending submissions: {str(e)}"
        )


@app.patch("/api/manager/submission/{submission_id}/verify")
def verify_submission(submission_id: str, request: VerifySubmissionRequest, req: Request):
    """Verify (approve/reject) a staff submission"""
    try:
        manager_id = req.headers.get("X-User-ID", "system")
        result = SubmissionVerificationService.verify_submission(
            submission_id,
            request.kpiId,
            request.status,
            request.comments or "",
            manager_id
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify submission: {str(e)}"
        )


@app.get("/api/manager/kpi/{kpi_id}/report")
def get_kpi_report(kpi_id: str):
    """Generate KPI performance report for all assigned staff"""
    try:
        result = KPIReportService.generate_report(kpi_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["message"]
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )


@app.get("/api/manager/kpi/{kpi_id}/report/export")
def export_kpi_report(kpi_id: str):
    """Export KPI report as CSV"""
    try:
        result = KPIReportService.export_report_data(kpi_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["message"]
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export report: {str(e)}"
        )


@app.get("/api/manager/kpi/{kpi_id}/prediction")
def get_kpi_prediction(kpi_id: str):
    """Get predicted KPI outcomes based on current performance"""
    try:
        result = KPIPredictionService.predict_kpi_outcome(kpi_id)
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["message"]
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get KPI prediction: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8006)