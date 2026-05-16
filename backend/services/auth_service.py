from fastapi import HTTPException, status
from google.cloud.firestore import FieldFilter
from firebase_secure import USERDATA_COLLECTION, USERAUTH_COLLECTION
from datetime import datetime
from utils.security import hash_password, verify_password, create_jwt_token
from utils.user_utils import build_public_user_document
from config.firebase_config import db
from utils.auth_utils import get_user_auth_hash, create_user_documents,allocate_next_user_id
from models.user_model import UserRegistration

import traceback

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


