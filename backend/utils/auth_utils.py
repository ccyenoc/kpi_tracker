from fastapi import HTTPException, status, Request
from config.firebase_config import db

from firebase_secure import (
    USERAUTH_COLLECTION,
    USERDATA_COLLECTION,
    USER_COUNTER_COLLECTION,
    USER_COUNTER_DOC
)

from google.api_core.exceptions import AlreadyExists
from firebase_admin import firestore

import traceback

# import from other utils
from utils.user_utils import build_user_profile_document
from utils.security import verify_jwt_token


# ── AUTH HASH ─────────────────────────────────────────

def get_user_auth_hash(user_id: str) -> str:
    auth_doc = db.collection(USERAUTH_COLLECTION).document(user_id).get()
    if not auth_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Authentication record not found"
        )

    auth_data = auth_doc.to_dict() or {}
    return auth_data.get("password_hash", "")


def save_user_auth_document(user_id: str, email: str, password_hash: str) -> None:
    db.collection(USERAUTH_COLLECTION).document(user_id).set({
        "userId": user_id,
        "email": email,
        "password_hash": password_hash,
    })


# ── USER CREATION ─────────────────────────────────────

def create_user_documents(users_ref, user_data, hashed_password: str):
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
            if attempt_number >= 10:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Unable to allocate user ID"
                )
            continue

        except Exception as e:
            traceback.print_exc()
            if attempt_number >= 10:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=str(e)
                )
            continue


# ── USER ID ALLOCATION ───────────────────────────────

def allocate_next_user_id(users_ref):
    @firestore.transactional
    def allocate_tx(transaction, users_ref_inner):
        counter_ref = db.collection(USER_COUNTER_COLLECTION).document(USER_COUNTER_DOC)
        snapshot = counter_ref.get(transaction=transaction)

        if snapshot.exists:
            data = snapshot.to_dict() or {}
            next_num = int(data.get("nextUserNumber", 100)) + 1
        else:
            next_num = 101

        transaction.set(counter_ref, {"nextUserNumber": next_num})
        return f"user_{next_num}"

    transaction = db.transaction()
    return allocate_tx(transaction, users_ref)


# ── AUTH HELPER ─────────────────────────────────────

def require_manager(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )

    token = auth_header.split(" ", 1)[1]
    
    try:
        decoded = verify_jwt_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = decoded.get("user_id")

    user_doc = db.collection(USERDATA_COLLECTION).document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict() or {}

    if user_data.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Manager access required")

    return decoded

def require_user(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )

    token = auth_header.split(" ", 1)[1]
    
    try:
        decoded = verify_jwt_token(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    user_id = decoded.get("user_id")

    user_doc = db.collection(USERDATA_COLLECTION).document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    return decoded