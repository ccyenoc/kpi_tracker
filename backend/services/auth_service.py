from fastapi import HTTPException, status
from google.cloud.firestore import FieldFilter
from firebase_secure import USERDATA_COLLECTION, USERAUTH_COLLECTION
from datetime import datetime
from utils.security import hash_password, verify_password, create_jwt_token, SECRET_KEY, SESSIONS_COLLECTION
import jwt
from utils.user_utils import build_public_user_document
from config.firebase_config import db
from utils.auth_utils import get_user_auth_hash, create_user_documents,allocate_next_user_id
from models.user_model import UserRegistration
from models.auth_model import EmailVerificationRequest, EmailCodeVerificationRequest
from email.message import EmailMessage
import re, traceback, secrets, time , os , hashlib, smtplib


from dotenv import load_dotenv

VERIFICATION_CODE_TTL_SECONDS = int(
    os.getenv("VERIFICATION_CODE_TTL_SECONDS", "600")
)

EMAIL_VERIFICATION_COLLECTION = os.getenv("EMAIL_VERIFICATION_COLLECTION", "emailVerifications")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").strip().lower() in ("1", "true", "yes", "on")


def register_user(user_data):
    required_fields = ['name', 'email', 'password', 'role', 'department']
    for field in required_fields:
        field_value = getattr(user_data, field)
        if not field_value or (isinstance(field_value, str) and not field_value.strip()):
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

    if user_data.role not in ['staff', 'manager']:
        raise HTTPException(status_code=400, detail="Role must be 'staff' or 'manager'")

    users_ref = db.collection(USERDATA_COLLECTION)

    existing_user = list(users_ref.where(filter=FieldFilter('email', '==', user_data.email)).stream())
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user_data.password)

    user_id, user_profile_doc = create_user_documents(users_ref, user_data, hashed_password)

    user_response = build_public_user_document(user_id, user_profile_doc)

    return {
        "success": True,
        "message": "Registration successful!",
        "user": user_response
    }


def login_user(credentials):
    users_ref = db.collection(USERDATA_COLLECTION)
    users = list(users_ref.where(filter=FieldFilter('email', '==', credentials.email)).stream())

    if not users:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_doc = users[0]
    user_id = user_doc.id
    user_data = user_doc.to_dict() or {}

    password_hash = get_user_auth_hash(user_id)
    if not verify_password(credentials.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_jwt_token(user_id, credentials.email)

    # Create a server-side session record keyed by the JWT "jti"
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        jti = payload.get("jti")
        expires = int(payload.get("exp", int(time.time()) + (24 * 3600)))
        if jti:
            db.collection(SESSIONS_COLLECTION).document(jti).set({
                "jti": jti,
                "user_id": user_id,
                "createdAt": int(time.time()),
                "expiresAt": expires,
                "revoked": False,
            })
    except Exception as e:
        print(f"Warning: could not persist session record: {e}")

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

def save_user_profile_document(user_ref, user_profile: dict) -> None:
    """Overwrite a Firestore profile document with only the allowed fields."""
    user_ref.set(build_user_profile_document(user_profile))

def build_user_profile_document(user_data: UserRegistration | dict) -> dict:
    """Create the exact Firestore profile document shape for a user."""
    return {
        "name": user_data["name"] if isinstance(user_data, dict) else user_data.name,
        "email": user_data["email"] if isinstance(user_data, dict) else user_data.email,
        "phone": (user_data["phone"] if isinstance(user_data, dict) else user_data.phone) or "",
        "role": user_data["role"] if isinstance(user_data, dict) else user_data.role,
        "department": user_data["department"] if isinstance(user_data, dict) else user_data.department,
    }


def normalize_email(email: str) -> str:
    """Return canonical lower-cased email for comparisons and storage."""
    return (email or "").strip().lower()


def generate_verification_code() -> str:
    """Generate a random 6-digit code."""
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_verification_code(email: str, code: str, salt: str) -> str:
    """Hash verification code to avoid storing raw codes in Firestore."""
    payload = f"{normalize_email(email)}:{salt}:{code}".encode("utf-8")    
    payload = f"{normalize_email(email)}:{salt}:{code}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def is_email_registered_case_insensitive(target_email: str) -> bool:
    """Check if an email already exists in userData, case-insensitive."""
    if not db:
        return False

    normalized_target = normalize_email(target_email)    
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

def send_verification_email_service(email_data: EmailVerificationRequest):
    """Generate and send a 6-digit verification code for signup email ownership."""
    try:
        target_email = normalize_email(email_data.email)
        if not target_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is required")

        # In a real scenario, generate a verification link and send it
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


def verify_email_code_service(verification_data: EmailCodeVerificationRequest):
    try:
        if not db:
            raise HTTPException(status_code=500, detail="Firebase not configured")

        # ✅ STEP 1: get input FIRST
        target_email = normalize_email(verification_data.email)
        code = (verification_data.code or "").strip()

        if not target_email:
            raise HTTPException(status_code=400, detail="Email is required")

        if not re.match(r"^\d{6}$", code):
            raise HTTPException(status_code=400, detail="Verification code must be 6 digits")

        # ✅ STEP 2: fetch from DB
        verification_ref = db.collection(EMAIL_VERIFICATION_COLLECTION).document(target_email)
        verification_doc = verification_ref.get()

        if not verification_doc.exists:
            raise HTTPException(status_code=404, detail="No verification code found")

        # ✅ STEP 3: extract data
        doc_data = verification_doc.to_dict() or {}

        expires_at = int(doc_data.get("expiresAt", 0))
        if int(time.time()) > expires_at:
            raise HTTPException(status_code=400, detail="Verification code expired")

        stored_salt = doc_data.get("codeSalt", "")
        stored_hash = doc_data.get("codeHash", "")

        # ✅ STEP 4: generate hash
        candidate_hash = hash_verification_code(target_email, code, stored_salt)

        # ✅ DEBUG (optional)
        print("INPUT CODE:", code)
        print("EMAIL:", target_email)
        print("STORED HASH:", stored_hash)
        print("GENERATED HASH:", candidate_hash)

        # ✅ STEP 5: compare
        if not secrets.compare_digest(candidate_hash, stored_hash):
            raise HTTPException(status_code=400, detail="Invalid verification code")

        # ✅ STEP 6: mark verified
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
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


def get_current_user_from_request(request):
    """Extract user information from JWT token in Authorization header."""
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header[7:]  # Remove "Bearer " prefix
        
        # Import verify_jwt_token from utils
        from utils.security import verify_jwt_token
        
        user_data = verify_jwt_token(token)
        if user_data:
            return {
                "id": user_data.get("user_id"),
                "email": user_data.get("email")
            }
        return None
    except Exception as e:
        print(f"Error extracting user from request: {e}")
        return None


def logout_user(request):
    """Invalidate the current JWT by marking its server-side session as revoked."""
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing Authorization header")

        token = auth_header.split(" ", 1)[1]

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        jti = payload.get("jti")
        if not jti:
            raise HTTPException(status_code=400, detail="Token missing session identifier")

        session_ref = db.collection(SESSIONS_COLLECTION).document(jti)
        session_doc = session_ref.get()
        if not session_doc.exists:
            # Nothing to revoke, but treat as success for idempotency
            return {"success": True, "message": "Logged out"}

        session_ref.update({"revoked": True})
        return {"success": True, "message": "Logged out"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout failed: {e}")