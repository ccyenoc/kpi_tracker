import pytest
from unittest.mock import patch, MagicMock

# FT-01: Get Current User Profile - GET /api/user
def test_get_current_user_profile_success(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "user_101", "email": "john@example.com"}
    
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+60123456789",
        "role": "staff",
        "department": "Sales"
    }
    
    def col_router(name):
        col = MagicMock()
        col.document.return_value.get.return_value = mock_doc
        return col
    db_mock.collection.side_effect = col_router
    
    response = client.get("/api/user", headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user"]["id"] == "user_101"
    assert data["user"]["name"] == "John Doe"

# FT-02: Get All Users - GET /api/users
def test_get_all_users_success(client, db_mock):
    mock_doc_1 = MagicMock()
    mock_doc_1.id = "user_101"
    mock_doc_1.to_dict.return_value = {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "",
        "role": "staff",
        "department": "Sales"
    }
    
    mock_doc_2 = MagicMock()
    mock_doc_2.id = "user_102"
    mock_doc_2.to_dict.return_value = {
        "name": "Mary Smith",
        "email": "mary@example.com",
        "phone": "+60111111111",
        "role": "manager",
        "department": "HR"
    }
    
    def col_router(name):
        col = MagicMock()
        col.stream.return_value = [mock_doc_1, mock_doc_2]
        return col
    db_mock.collection.side_effect = col_router
    
    response = client.get("/api/users")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["users"]) == 2
    assert data["users"][0]["id"] == "user_101"
    assert data["users"][1]["id"] == "user_102"

# FT-03: Update Profile - PUT /api/profile
def test_update_profile_success(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "user_101"}
    
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "name": "Old Name",
        "email": "john@example.com",
        "phone": "",
        "role": "staff",
        "department": "Sales"
    }
    
    # Mocking both get() calls inside update_profile service
    mock_doc_updated = MagicMock()
    mock_doc_updated.exists = True
    mock_doc_updated.to_dict.return_value = {
        "name": "New Name",
        "email": "john@example.com",
        "phone": "",
        "role": "staff",
        "department": "Marketing"
    }
    
    # Set side effects for the document get calls
    mock_doc_ref = MagicMock()
    mock_doc_ref.get.side_effect = [mock_doc, mock_doc_updated]
    
    # We will return the document mock specifically for userData collection
    def collection_router(name):
        col = MagicMock()
        if name == "userData":
            col.document.return_value = mock_doc_ref
        return col
    db_mock.collection.side_effect = collection_router
    
    payload = {"name": "New Name", "department": "Marketing"}
    response = client.put("/api/profile", json=payload, headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Profile updated"
    assert data["user"]["name"] == "New Name"

# FT-04: Change Password - PUT /api/password
@patch("services.user_service.get_user_auth_hash")
@patch("services.user_service.verify_password")
@patch("services.user_service.hash_password")
@patch("services.user_service.save_user_auth_document")
def test_change_password_success(
    mock_save_auth,
    mock_hash,
    mock_verify,
    mock_get_hash,
    client,
    jwt_mock
):
    jwt_mock.return_value = {"user_id": "user_101"}
    mock_get_hash.return_value = "hashed_old_password"
    mock_verify.return_value = True
    mock_hash.return_value = "hashed_new_password"
    
    payload = {
        "currentPassword": "OldPass123!",
        "newPassword": "NewPass456!",
        "confirmPassword": "NewPass456!"
    }
    response = client.put("/api/password", json=payload, headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Password updated"

# FT-05: Delete Account - DELETE /api/profile
def test_delete_account_success(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "user_101"}
    
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    
    mock_user_ref = MagicMock()
    mock_user_ref.get.return_value = mock_user_doc
    
    mock_auth_doc = MagicMock()
    mock_auth_doc.exists = True
    mock_auth_ref = MagicMock()
    mock_auth_ref.get.return_value = mock_auth_doc
    
    def collection_router(name):
        col = MagicMock()
        if name == "userData":
            col.document.return_value = mock_user_ref
        elif name == "userAuth":
            col.document.return_value = mock_auth_ref
        else:
            col.document.return_value = MagicMock()
        col.where.return_value = col
        col.stream.return_value = []
        return col

    db_mock.collection.side_effect = collection_router
    
    response = client.delete("/api/profile", headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Account deleted"
    mock_user_ref.delete.assert_called_once()
    mock_auth_ref.delete.assert_called_once()
