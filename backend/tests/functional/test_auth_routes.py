import pytest
from unittest.mock import patch, MagicMock

# FT-01: User Registration Route Test
@patch("routes.auth_routes.register_user")
def test_register_route_success(mock_register, client):
    mock_register.return_value = {
        "success": True,
        "message": "Registration successful!",
        "user": {"id": "user_101", "name": "John Doe", "email": "john@company.com"}
    }
    
    payload = {
        "name": "John Doe",
        "email": "john@company.com",
        "password": "password123",
        "role": "staff",
        "department": "Engineering"
    }
    
    response = client.post("/api/register", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["id"] == "user_101"
    mock_register.assert_called_once()


# FT-02: User Login Route Test
@patch("routes.auth_routes.login_user")
def test_login_route_success(mock_login, client):
    mock_login.return_value = {
        "success": True,
        "message": "Login successful!",
        "token": "mock_jwt_token",
        "dashboard": "/staff/dashboard",
        "user": {"id": "user_101", "name": "John Doe", "email": "john@company.com"}
    }
    
    payload = {
        "email": "john@company.com",
        "password": "password123"
    }
    
    response = client.post("/api/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["token"] == "mock_jwt_token"
    assert data["dashboard"] == "/staff/dashboard"
    mock_login.assert_called_once()


# FT-04: Send Email Verification Route Test
@patch("routes.auth_routes.send_verification_email_service")
def test_verify_email_route_success(mock_send_email, client):
    mock_send_email.return_value = {
        "success": True,
        "message": "Verification code sent successfully",
        "expiresInSeconds": 600
    }
    
    payload = {
        "email": "john@company.com"
    }
    
    response = client.post("/api/verify-email", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Verification code sent" in data["message"]
    mock_send_email.assert_called_once()


# FT-04: Verify Code Route Test
@patch("routes.auth_routes.verify_email_code_service")
def test_verify_code_route_success(mock_verify_code, client):
    mock_verify_code.return_value = {
        "success": True,
        "message": "Email verified successfully"
    }
    
    payload = {
        "email": "john@company.com",
        "code": "123456"
    }
    
    response = client.post("/api/verify-code", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Email verified successfully"
    mock_verify_code.assert_called_once()


# FT-06: Logout Route Tests
@patch("routes.auth_routes.logout_user")
def test_logout_auth_route_success(mock_logout, client):
    mock_logout.return_value = {
        "success": True,
        "message": "Logged out"
    }
    
    headers = {"Authorization": "Bearer mock_jwt_token"}
    response = client.post("/api/auth/logout", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Logged out"
    mock_logout.assert_called_once()
