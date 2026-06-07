from fastapi import HTTPException, status
from utils.security import verify_jwt_token, verify_password, hash_password
from utils.security import SESSIONS_COLLECTION
from utils.user_utils import build_public_user_document
from utils.auth_utils import save_user_auth_document
from services.auth_service import save_user_profile_document, get_user_auth_hash
from config.firebase_config import db
from firebase_secure import USERDATA_COLLECTION, USERAUTH_COLLECTION


def get_current_user(token: str):
    decoded = verify_jwt_token(token)
    user_id = decoded.get('user_id')

    user_doc = db.collection(USERDATA_COLLECTION).document(user_id).get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_doc.to_dict() or {}
    return build_public_user_document(user_id, user_data)


def get_all_users():
    users_ref = db.collection(USERDATA_COLLECTION)
    users = users_ref.stream()

    user_list = []
    for user in users:
        user_data = user.to_dict() or {}
        user_list.append(build_public_user_document(user.id, user_data))

    return user_list


def update_profile(user_id, profile_data):
    user_ref = db.collection(USERDATA_COLLECTION).document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")

    updated_user = user_doc.to_dict() or {}

    if profile_data.name:
        updated_user["name"] = profile_data.name
    if profile_data.phone is not None:
        updated_user["phone"] = profile_data.phone
    if profile_data.department:
        updated_user["department"] = profile_data.department

    save_user_profile_document(user_ref, updated_user)

    updated_user = user_ref.get().to_dict() or {}
    return build_public_user_document(user_id, updated_user)


def update_password(user_id, password_data):
    if password_data.newPassword != password_data.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    password_hash = get_user_auth_hash(user_id)

    if not verify_password(password_data.currentPassword, password_hash):
        raise HTTPException(status_code=401, detail="Current password incorrect")

    new_hash = hash_password(password_data.newPassword)

    save_user_auth_document(user_id, "", new_hash)

    return True


def delete_account(user_id):
    user_ref = db.collection(USERDATA_COLLECTION).document(user_id)
    auth_ref = db.collection(USERAUTH_COLLECTION).document(user_id)

    if not user_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")

    user_ref.delete()
    if auth_ref.get().exists:
        auth_ref.delete()

    # Revoke all server-side sessions for this user to prevent stale tokens
    sessions = db.collection(SESSIONS_COLLECTION).where("user_id", "==", user_id).stream()
    for session in sessions:
        session.reference.set({"revoked": True}, merge=True)

    return True

def get_all_staff():
    try:
        if not db:
            raise Exception("Firebase not initialized")

        users_ref = db.collection("userData")

        staff = []
        for doc in users_ref.stream():
            data = doc.to_dict() or {}

            if data.get("role") == "staff":
                staff.append({
                    "id": doc.id,
                    "name": data.get("name", ""),
                    "email": data.get("email", ""),
                    "role": data.get("role", "")
                })

        print("STAFF RETURNED:", staff)  # DEBUG
        return staff

    except Exception as e:
        print("🔥 ERROR in /staff:", e)
        raise e