from pydantic import BaseModel
from typing import Optional

class UserRegistration(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    role: str
    department: str

class UserLogin(BaseModel):
    email: str
    password: str

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
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