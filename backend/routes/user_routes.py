from fastapi import APIRouter, Request, HTTPException, status
from utils.security import verify_jwt_token
from models.user_model import ProfileUpdate, PasswordUpdate
from services.user_service import (
    get_current_user,
    get_all_users,
    get_all_staff,
    update_profile,
    update_password,
    delete_account
)

router = APIRouter()


def extract_token(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header"
        )
    return auth_header.split(" ", 1)[1]


@router.get("/user")
def get_user(request: Request):
    token = extract_token(request)
    user = get_current_user(token)
    return {"success": True, "user": user}


@router.get("/users")
def users():
    return {"success": True, "users": get_all_users()}


@router.put("/profile")
def update_user_profile(profile_data: ProfileUpdate, request: Request):
    token = extract_token(request)
    decoded = verify_jwt_token(token)
    user_id = decoded.get("user_id")

    user = update_profile(user_id, profile_data)

    return {
        "success": True,
        "message": "Profile updated",
        "user": user
    }


@router.put("/password")
def change_password(password_data: PasswordUpdate, request: Request):
    token = extract_token(request)
    decoded = verify_jwt_token(token)
    user_id = decoded.get("user_id")

    update_password(user_id, password_data)

    return {
        "success": True,
        "message": "Password updated"
    }


@router.delete("/profile")
def delete_user(request: Request):
    token = extract_token(request)
    decoded = verify_jwt_token(token)
    user_id = decoded.get("user_id")

    delete_account(user_id)

    return {
        "success": True,
        "message": "Account deleted"
    }

@router.get("/staff")
def get_staff():
    return get_all_staff()