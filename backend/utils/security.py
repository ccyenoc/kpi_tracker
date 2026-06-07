import bcrypt, os
import jwt
import time
import uuid

from config.firebase_config import db

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev_secret")
SESSIONS_COLLECTION = os.getenv("SESSIONS_COLLECTION", "sessions")

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_jwt_token(user_id: str, email: str) -> str:
    jti = str(uuid.uuid4())
    payload = {"user_id": user_id, "email": email, "exp": int(time.time()) + (24 * 3600), "jti": jti}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def verify_jwt_token(token: str) -> dict:
    # Decode and verify signature / expiration
    decoded = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])

    # Check server-side session store for jti presence and expiry
    jti = decoded.get("jti")
    if not jti:
        raise Exception("Missing session identifier (jti)")

    try:
        session_doc = db.collection(SESSIONS_COLLECTION).document(jti).get()
    except Exception:
        raise Exception("Session store unavailable")

    if not session_doc.exists:
        raise Exception("Session not found or revoked")

    session_data = session_doc.to_dict() or {}
    expires_at = int(session_data.get("expiresAt", 0))
    if int(time.time()) > expires_at:
        raise Exception("Session expired")

    if session_data.get("revoked", False):
        raise Exception("Session revoked")

    return decoded