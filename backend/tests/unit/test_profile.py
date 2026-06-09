import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from models.user_model import ProfileUpdate, PasswordUpdate
from utils.user_utils import build_public_user_document
from services.auth_service import build_user_profile_document
from utils.security import hash_password, verify_password
from services import user_service

# UT-01: ProfileUpdate Model Validation
def test_profile_update_model_validation():
    profile = ProfileUpdate(
        name="John Doe",
        phone="+60123456789",
        department="Engineering"
    )
    assert profile.name == "John Doe"
    assert profile.phone == "+60123456789"
    assert profile.department == "Engineering"

    # Partial update validation
    profile_partial = ProfileUpdate(name="Jane Doe")
    assert profile_partial.name == "Jane Doe"
    assert profile_partial.phone is None
    assert profile_partial.department is None

    # Empty update validation
    profile_empty = ProfileUpdate()
    assert profile_empty.name is None
    assert profile_empty.phone is None
    assert profile_empty.department is None

# UT-02: PasswordUpdate Model Validation
def test_password_update_model_validation():
    password_data = PasswordUpdate(
        currentPassword="OldPass123!",
        newPassword="NewPass456!",
        confirmPassword="NewPass456!"
    )
    assert password_data.currentPassword == "OldPass123!"
    assert password_data.newPassword == "NewPass456!"
    assert password_data.confirmPassword == "NewPass456!"

# UT-03: User Profile Document Builder
def test_user_profile_document_builder():
    user_data = {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+60123456789",
        "role": "staff",
        "department": "Sales"
    }
    result = build_user_profile_document(user_data)
    assert result["name"] == "John Doe"
    assert result["email"] == "john@example.com"
    assert result["phone"] == "+60123456789"
    assert result["role"] == "staff"
    assert result["department"] == "Sales"

    # Default phone to empty string when missing
    user_data_no_phone = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "manager",
        "department": "HR"
    }
    result_no_phone = build_user_profile_document(user_data_no_phone)
    assert result_no_phone["phone"] == ""

def test_build_public_user_document():
    # Public document builder inserts ID
    user_data = {
        "name": "Alice",
        "email": "alice@example.com",
        "phone": "",
        "role": "staff",
        "department": "IT"
    }
    result = build_public_user_document("user_101", user_data)
    assert result["id"] == "user_101"
    assert result["name"] == "Alice"
    assert "password" not in result

# UT-04: Password Hashing and Verification
def test_password_hashing_and_verification():
    password = "SecurePass123!"
    hashed = hash_password(password)
    assert hashed is not None
    assert hashed != password
    assert len(hashed) > 0
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPass123!", hashed) is False

# UT-05: Update Password Service Logic
def test_update_password_rejects_mismatch():
    password_data = PasswordUpdate(
        currentPassword="OldPass123!",
        newPassword="NewPass456!",
        confirmPassword="DifferentPass789!"
    )
    with pytest.raises(HTTPException) as exc_info:
        user_service.update_password("user_101", password_data)
    assert exc_info.value.status_code == 400
    assert "Passwords do not match" in exc_info.value.detail

@patch("services.user_service.get_user_auth_hash")
@patch("services.user_service.verify_password")
@patch("services.user_service.hash_password")
@patch("services.user_service.save_user_auth_document")
def test_update_password_accepts_valid_password(
    mock_save_auth,
    mock_hash_password,
    mock_verify_password,
    mock_get_hash
):
    password_data = PasswordUpdate(
        currentPassword="OldPass123!",
        newPassword="NewPass456!",
        confirmPassword="NewPass456!"
    )
    mock_get_hash.return_value = "hashed_old_password"
    mock_verify_password.return_value = True
    mock_hash_password.return_value = "hashed_new_password"

    result = user_service.update_password("user_101", password_data)
    assert result is True
    mock_save_auth.assert_called_once_with("user_101", "", "hashed_new_password")

@patch("services.user_service.get_user_auth_hash")
@patch("services.user_service.verify_password")
def test_update_password_rejects_wrong_current_password(
    mock_verify_password,
    mock_get_hash
):
    password_data = PasswordUpdate(
        currentPassword="WrongCurrent!",
        newPassword="NewPass456!",
        confirmPassword="NewPass456!"
    )
    mock_get_hash.return_value = "hashed_old_password"
    mock_verify_password.return_value = False

    with pytest.raises(HTTPException) as exc_info:
        user_service.update_password("user_101", password_data)
    assert exc_info.value.status_code == 401
    assert "Current password incorrect" in exc_info.value.detail
