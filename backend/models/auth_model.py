from pydantic import BaseModel

class EmailVerificationRequest(BaseModel):
    email: str

class EmailCodeVerificationRequest(BaseModel):
    email: str
    code: str




    