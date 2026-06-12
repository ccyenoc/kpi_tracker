import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from models.user_model import UserRegistration, UserLogin
from models.auth_model import EmailCodeVerificationRequest
from services import auth_service

def test_register_user_success():
    # UT-01: Successful User Registration
    user_data = UserRegistration(
        name="John Tan",
        email="john@company.com",
        password="abc123456",
        role="staff",
        department="HR"
    )

    with patch('services.auth_service.hash_password') as mock_hash, \
         patch('services.auth_service.create_user_documents') as mock_create_docs, \
         patch('services.auth_service.db.collection') as mock_collection:
         
        mock_hash.return_value = "hashed_password"
        mock_create_docs.return_value = ("user_101", {
            "name": "John Tan",
            "email": "john@company.com",
            "phone": "",
            "role": "staff",
            "department": "HR"
        })
        
        # Mock checks for existing email
        mock_stream = MagicMock()
        mock_stream.stream.return_value = []
        mock_collection.return_value.where.return_value = mock_stream
        
        result = auth_service.register_user(user_data)
        
        assert result["success"] is True
        assert result["message"] == "Registration successful!"
        assert result["user"]["id"] == "user_101"
        assert result["user"]["name"] == "John Tan"

def test_register_user_missing_required_fields():
    # UT-02: Registration Missing Required Field (e.g., name is empty)
    user_data = UserRegistration(
        name="",
        email="john@company.com",
        password="abc123456",
        role="staff",
        department="HR"
    )

    with pytest.raises(HTTPException) as exc_info:
        auth_service.register_user(user_data)
        
    assert exc_info.value.status_code == 400
    assert "Missing required field: name" in exc_info.value.detail

def test_login_user_success_staff():
    # UT-03: Successful Staff Login
    credentials = UserLogin(email="john@company.com", password="abc123456")

    with patch('services.auth_service.get_user_auth_hash') as mock_get_hash, \
         patch('services.auth_service.verify_password') as mock_verify, \
         patch('services.auth_service.create_jwt_token') as mock_token, \
         patch('services.auth_service.save_user_profile_document') as mock_save_prof, \
         patch('services.auth_service.db.collection') as mock_collection:

        mock_get_hash.return_value = "hashed_pwd"
        mock_verify.return_value = True
        mock_token.return_value = "mock_jwt_token"

        mock_user = MagicMock()
        mock_user.id = "user_101"
        mock_user.to_dict.return_value = {
            "name": "John Tan",
            "email": "john@company.com",
            "role": "staff",
            "department": "HR",
            "phone": ""
        }

        mock_stream = MagicMock()
        mock_stream.stream.return_value = [mock_user]
        mock_collection.return_value.where.return_value = mock_stream

        result = auth_service.login_user(credentials)

        assert result["success"] is True
        assert result["token"] == "mock_jwt_token"
        assert result["dashboard"] == "/staff/dashboard"

def test_login_user_incorrect_password():
    # UT-04: Login Password Incorrect
    credentials = UserLogin(email="john@company.com", password="wrongpassword")

    with patch('services.auth_service.get_user_auth_hash') as mock_get_hash, \
         patch('services.auth_service.verify_password') as mock_verify, \
         patch('services.auth_service.db.collection') as mock_collection:

        mock_get_hash.return_value = "hashed_pwd"
        mock_verify.return_value = False

        mock_user = MagicMock()
        mock_user.id = "user_101"
        mock_user.to_dict.return_value = {
            "name": "John Tan",
            "email": "john@company.com",
            "role": "staff",
            "phone": ""
        }

        mock_stream = MagicMock()
        mock_stream.stream.return_value = [mock_user]
        mock_collection.return_value.where.return_value = mock_stream

        with pytest.raises(HTTPException) as exc_info:
            auth_service.login_user(credentials)

        assert exc_info.value.status_code == 401
        assert "Invalid email or password" in exc_info.value.detail

def test_verify_email_code_success():
    # UT-05: Verify Email Code Successfully (corrected to match verification request parameters)
    verification_data = EmailCodeVerificationRequest(email="john@company.com", code="987654")

    with patch('services.auth_service.hash_verification_code') as mock_hash_code, \
         patch('services.auth_service.db.collection') as mock_collection:

        mock_hash_code.return_value = "matching_hash"
        
        mock_doc = MagicMock()
        mock_doc.exists = True
        import time
        mock_doc.to_dict.return_value = {
            "codeSalt": "salt123",
            "codeHash": "matching_hash",
            "expiresAt": int(time.time()) + 600,
            "createdAt": int(time.time())
        }

        mock_collection.return_value.document.return_value.get.return_value = mock_doc

        result = auth_service.verify_email_code_service(verification_data)

        assert result["success"] is True
        assert result["message"] == "Email verified successfully"
