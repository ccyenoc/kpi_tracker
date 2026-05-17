from fastapi import APIRouter
from models.user_model import UserRegistration, UserLogin
from models.auth_model import EmailVerificationRequest, EmailCodeVerificationRequest
from services.auth_service import register_user, login_user, send_verification_email_service, verify_email_code_service


router = APIRouter()

@router.post("/register")
def register(user: UserRegistration):
    return register_user(user)

@router.post("/login")
def login(user: UserLogin):
    return login_user(user)

@router.post("/verify-email")
def send_verification_email(email_data: EmailVerificationRequest) :
    return send_verification_email_service(email_data)

@router.post("/verify-code")
def verify_code(data: EmailCodeVerificationRequest):
    return verify_email_code_service(data)