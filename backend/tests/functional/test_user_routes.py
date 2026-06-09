import pytest
from unittest.mock import patch, MagicMock

# FT-01: Get Current User Profile - GET /api/user
def test_get_current_user_returns_200(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "user_101"}
    
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "name": "John Doe",
        "email": "john@company.com",
        "phone": "+60123456789",
        "role": "staff",
        "department": "Sales"
    }
    
    def col_router(name):
        col = MagicMock()
        col.document.return_value.get.return_value = mock_doc
        return col
    db_mock.collection.side_effect = col_router

    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/user", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["user"]["id"] == "user_101"

def test_get_current_user_contains_profile_fields(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "user_101"}
    
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "name": "Jane Doe",
        "email": "jane@company.com",
        "phone": "",
        "role": "manager",
        "department": "HR"
    }
    
    def col_router(name):
        col = MagicMock()
        col.document.return_value.get.return_value = mock_doc
        return col
    db_mock.collection.side_effect = col_router

    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/user", headers=headers)
    user = response.json()["user"]
    assert user["name"] == "Jane Doe"
    assert user["email"] == "jane@company.com"
    assert user["role"] == "manager"
    assert user["department"] == "HR"

def test_get_current_user_not_found(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "missing_user"}
    
    mock_doc = MagicMock()
    mock_doc.exists = False
    
    def col_router(name):
        col = MagicMock()
        col.document.return_value.get.return_value = mock_doc
        return col
    db_mock.collection.side_effect = col_router

    headers = {"Authorization": "Bearer valid_token"}
    response = client.get("/api/user", headers=headers)
    assert response.status_code == 404


# FT-02: Get All Users - GET /api/users
def test_get_all_users_returns_200(client, db_mock):
    mock_doc_1 = MagicMock()
    mock_doc_1.id = "user_101"
    mock_doc_1.to_dict.return_value = {
        "name": "John Doe",
        "email": "john@company.com",
        "phone": "",
        "role": "staff",
        "department": "Sales"
    }
    mock_doc_2 = MagicMock()
    mock_doc_2.id = "user_102"
    mock_doc_2.to_dict.return_value = {
        "name": "Mary Smith",
        "email": "mary@company.com",
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
    assert response.json()["success"] is True

def test_get_all_users_returns_user_array(client, db_mock):
    mock_doc = MagicMock()
    mock_doc.id = "user_101"
    mock_doc.to_dict.return_value = {
        "name": "Alice",
        "email": "alice@example.com",
        "phone": "",
        "role": "staff",
        "department": "IT"
    }

    def col_router(name):
        col = MagicMock()
        col.stream.return_value = [mock_doc]
        return col
    db_mock.collection.side_effect = col_router

    response = client.get("/api/users")
    users = response.json()["users"]
    assert isinstance(users, list)
    assert len(users) == 1
    assert users[0]["id"] == "user_101"

def test_get_all_users_each_item_has_required_fields(client, db_mock):
    mock_doc = MagicMock()
    mock_doc.id = "user_103"
    mock_doc.to_dict.return_value = {
        "name": "Bob",
        "email": "bob@example.com",
        "phone": "+60122222222",
        "role": "staff",
        "department": "Finance"
    }

    def col_router(name):
        col = MagicMock()
        col.stream.return_value = [mock_doc]
        return col
    db_mock.collection.side_effect = col_router

    response = client.get("/api/users")
    user = response.json()["users"][0]
    assert "id" in user
    assert "name" in user
    assert "email" in user
    assert "phone" in user
    assert "role" in user
    assert "department" in user


# FT-03: Update Profile - PUT /api/profile
def test_update_profile_name_and_department(client, db_mock, jwt_mock):
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
    
    mock_doc_updated = MagicMock()
    mock_doc_updated.exists = True
    mock_doc_updated.to_dict.return_value = {
        "name": "New Name",
        "email": "john@example.com",
        "phone": "",
        "role": "staff",
        "department": "Marketing"
    }

    mock_doc_ref = MagicMock()
    mock_doc_ref.get.side_effect = [mock_doc, mock_doc_updated]

    def col_router(name):
        col = MagicMock()
        if name == "userData":
            col.document.return_value = mock_doc_ref
        return col
    db_mock.collection.side_effect = col_router

    headers = {"Authorization": "Bearer valid_token"}
    payload = {"name": "New Name", "department": "Marketing"}
    response = client.put("/api/profile", json=payload, headers=headers)

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["message"] == "Profile updated"

def test_update_profile_partial_fields(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "user_102"}

    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {
        "name": "Mary",
        "email": "mary@example.com",
        "phone": "+60111111111",
        "role": "manager",
        "department": "HR"
    }
    
    mock_doc_updated = MagicMock()
    mock_doc_updated.exists = True
    mock_doc_updated.to_dict.return_value = {
        "name": "Mary Updated",
        "email": "mary@example.com",
        "phone": "+60111111111",
        "role": "manager",
        "department": "HR"
    }

    mock_doc_ref = MagicMock()
    mock_doc_ref.get.side_effect = [mock_doc, mock_doc_updated]

    def col_router(name):
        col = MagicMock()
        if name == "userData":
            col.document.return_value = mock_doc_ref
        return col
    db_mock.collection.side_effect = col_router

    headers = {"Authorization": "Bearer valid_token"}
    response = client.put("/api/profile", json={"name": "Mary Updated"}, headers=headers)

    assert response.status_code == 200
    assert response.json()["user"]["name"] == "Mary Updated"

def test_update_profile_user_not_found(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "missing_user"}

    mock_doc = MagicMock()
    mock_doc.exists = False

    def col_router(name):
        col = MagicMock()
        col.document.return_value.get.return_value = mock_doc
        return col
    db_mock.collection.side_effect = col_router

    headers = {"Authorization": "Bearer valid_token"}
    response = client.put("/api/profile", json={"name": "New Name"}, headers=headers)
    assert response.status_code == 404


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

    headers = {"Authorization": "Bearer valid_token"}
    payload = {
        "currentPassword": "OldPass123!",
        "newPassword": "NewPass456!",
        "confirmPassword": "NewPass456!"
    }
    response = client.put("/api/password", json=payload, headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["message"] == "Password updated"

def test_change_password_mismatch(client, jwt_mock):
    jwt_mock.return_value = {"user_id": "user_101"}

    headers = {"Authorization": "Bearer valid_token"}
    payload = {
        "currentPassword": "OldPass123!",
        "newPassword": "NewPass456!",
        "confirmPassword": "DifferentPass!"
    }
    response = client.put("/api/password", json=payload, headers=headers)
    assert response.status_code == 400

@patch("services.user_service.get_user_auth_hash")
@patch("services.user_service.verify_password")
def test_change_password_wrong_current_password(
    mock_verify,
    mock_get_hash,
    client,
    jwt_mock
):
    jwt_mock.return_value = {"user_id": "user_101"}
    mock_get_hash.return_value = "hashed_old_password"
    mock_verify.return_value = False

    headers = {"Authorization": "Bearer valid_token"}
    payload = {
        "currentPassword": "WrongOldPass!",
        "newPassword": "NewPass456!",
        "confirmPassword": "NewPass456!"
    }
    response = client.put("/api/password", json=payload, headers=headers)
    assert response.status_code == 401


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

    def col_router(name):
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
    db_mock.collection.side_effect = col_router

    headers = {"Authorization": "Bearer valid_token"}
    response = client.delete("/api/profile", headers=headers)
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["message"] == "Account deleted"
    mock_user_ref.delete.assert_called_once()
    mock_auth_ref.delete.assert_called_once()

def test_delete_account_user_not_found(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "missing_user"}

    mock_user_doc = MagicMock()
    mock_user_doc.exists = False
    mock_user_ref = MagicMock()
    mock_user_ref.get.return_value = mock_user_doc

    def col_router(name):
        col = MagicMock()
        if name == "userData":
            col.document.return_value = mock_user_ref
        return col
    db_mock.collection.side_effect = col_router

    headers = {"Authorization": "Bearer valid_token"}
    response = client.delete("/api/profile", headers=headers)
    assert response.status_code == 404

def test_delete_account_deletes_auth_record_if_exists(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "user_101"}

    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_ref = MagicMock()
    mock_user_ref.get.return_value = mock_user_doc

    mock_auth_doc = MagicMock()
    mock_auth_doc.exists = True
    mock_auth_ref = MagicMock()
    mock_auth_ref.get.return_value = mock_auth_doc

    def col_router(name):
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
    db_mock.collection.side_effect = col_router

    headers = {"Authorization": "Bearer valid_token"}
    response = client.delete("/api/profile", headers=headers)
    assert response.status_code == 200


# FT-06: Get Staff List - GET /api/staff
def test_get_staff_returns_only_staff(client, db_mock):
    mock_doc_1 = MagicMock()
    mock_doc_1.id = "staff_101"
    mock_doc_1.to_dict.return_value = {
        "name": "Staff One",
        "email": "staff1@example.com",
        "role": "staff"
    }
    mock_doc_2 = MagicMock()
    mock_doc_2.id = "mgr_101"
    mock_doc_2.to_dict.return_value = {
        "name": "Manager One",
        "email": "manager@example.com",
        "role": "manager"
    }

    def col_router(name):
        col = MagicMock()
        col.stream.return_value = [mock_doc_1, mock_doc_2]
        return col
    db_mock.collection.side_effect = col_router

    response = client.get("/api/staff")
    assert response.status_code == 200
    staff_list = response.json()
    assert len(staff_list) == 1
    assert staff_list[0]["role"] == "staff"

def test_get_staff_has_required_fields(client, db_mock):
    mock_doc = MagicMock()
    mock_doc.id = "staff_102"
    mock_doc.to_dict.return_value = {
        "name": "Staff Two",
        "email": "staff2@example.com",
        "role": "staff"
    }

    def col_router(name):
        col = MagicMock()
        col.stream.return_value = [mock_doc]
        return col
    db_mock.collection.side_effect = col_router

    response = client.get("/api/staff")
    staff = response.json()[0]
    assert "id" in staff
    assert "name" in staff
    assert "email" in staff
    assert "role" in staff

def test_get_staff_returns_empty_list_when_no_staff(client, db_mock):
    mock_doc = MagicMock()
    mock_doc.id = "mgr_101"
    mock_doc.to_dict.return_value = {
        "name": "Manager One",
        "email": "manager@example.com",
        "role": "manager"
    }

    def col_router(name):
        col = MagicMock()
        col.stream.return_value = [mock_doc]
        return col
    db_mock.collection.side_effect = col_router

    response = client.get("/api/staff")
    assert response.status_code == 200
    assert response.json() == []
