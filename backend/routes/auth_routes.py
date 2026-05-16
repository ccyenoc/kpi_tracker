from fastapi import APIRouter
from models.user_model import UserRegistration, UserLogin
from services.auth_service import register_user, login_user

router = APIRouter()

@router.post("/register")
def register(user: UserRegistration):
    return register_user(user)

@router.post("/login")
def login(user: UserLogin):
    return login_user(user)