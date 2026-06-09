import pytest
import time
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from config.firebase_config import db
from utils.auth_utils import allocate_next_user_id
from services import auth_service, kpi_service

# DB-01: Firestore CRUD for User Profiles
@patch("services.auth_service.db")
def test_firebase_crud_user_profile(mock_db):
    mock_users_ref = MagicMock()
    mock_doc_ref = MagicMock()
    mock_users_ref.document.return_value = mock_doc_ref
    mock_db.collection.return_value = mock_users_ref

    from services.auth_service import create_user_documents
    from models.user_model import UserRegistration
    user_data = UserRegistration(
        name="Jane User",
        email="jane@company.com",
        password="password123",
        role="staff",
        department="Engineering"
    )
    
    with patch("utils.auth_utils.db", mock_db), \
         patch("utils.auth_utils.allocate_next_user_id", return_value="user_101"):
        user_id, profile = create_user_documents(mock_users_ref, user_data, "hashed_password")
        
    assert user_id == "user_101"
    assert profile["name"] == "Jane User"
    assert profile["role"] == "staff"
    mock_doc_ref.create.assert_called()


# DB-02: Firestore CRUD for KPI Records
@patch("services.kpi_service.db")
def test_firebase_crud_kpi_records(mock_db):
    mock_doc_ref = MagicMock()
    mock_db.collection.return_value.document.return_value = mock_doc_ref

    from services.kpi_service import get_kpi_by_id
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"title": "Test KPI", "target": 100}
    mock_doc_ref.get.return_value = mock_doc

    result = get_kpi_by_id("kpi_999")
    assert result["title"] == "Test KPI"
    assert result["target"] == 100
    mock_db.collection.assert_called_with("kpiData")


# DB-03: Transaction-Based Sequential ID Allocation
@patch("utils.auth_utils.db")
def test_transactional_id_allocation(mock_db):
    mock_transaction = MagicMock()
    mock_db.transaction.return_value = mock_transaction
    
    mock_counter_snap = MagicMock()
    mock_counter_snap.exists = True
    mock_counter_snap.to_dict.return_value = {"nextUserNumber": 150}
    
    mock_counter_ref = MagicMock()
    mock_counter_ref.get.return_value = mock_counter_snap
    mock_db.collection.return_value.document.return_value = mock_counter_ref

    def tx_runner(transactional_function, *args, **kwargs):
        return transactional_function(mock_transaction, *args, **kwargs)
    mock_db.transactional = lambda f: f
    
    with patch("utils.auth_utils.firestore.transactional", lambda f: f):
        result = allocate_next_user_id(MagicMock())
        
    assert result == "user_151"
    mock_transaction.set.assert_called_once_with(mock_counter_ref, {"nextUserNumber": 151})


# DB-04: Session Database Operations (revoked, active, expired states)
def test_verify_jwt_session_active(db_mock):
    import utils.security
    from utils.security import SESSIONS_COLLECTION
    token = utils.security.create_jwt_token("user_101", "user@company.com")

    mock_session_doc = MagicMock()
    mock_session_doc.exists = True
    import time
    mock_session_doc.to_dict.return_value = {
        "jti": "some_jti",
        "user_id": "user_101",
        "expiresAt": int(time.time()) + 3600,
        "revoked": False
    }

    mock_session_ref = MagicMock()
    mock_session_ref.document.return_value.get.return_value = mock_session_doc
    db_mock.collection.side_effect = None
    db_mock.collection.return_value = mock_session_ref

    decoded = utils.security.original_verify_jwt_token(token)
    assert decoded["user_id"] == "user_101"

def test_verify_jwt_session_revoked(db_mock):
    import utils.security
    token = utils.security.create_jwt_token("user_101", "user@company.com")

    mock_session_doc = MagicMock()
    mock_session_doc.exists = True
    mock_session_doc.to_dict.return_value = {
        "jti": "some_jti",
        "user_id": "user_101",
        "expiresAt": int(time.time()) + 3600,
        "revoked": True
    }
    mock_session_ref = MagicMock()
    mock_session_ref.document.return_value.get.return_value = mock_session_doc
    db_mock.collection.side_effect = None
    db_mock.collection.return_value = mock_session_ref

    with pytest.raises(Exception) as exc_info:
        utils.security.original_verify_jwt_token(token)
    assert "Session revoked" in str(exc_info.value)

def test_verify_jwt_session_expired(db_mock):
    import utils.security
    token = utils.security.create_jwt_token("user_101", "user@company.com")

    mock_session_doc = MagicMock()
    mock_session_doc.exists = True
    import time
    mock_session_doc.to_dict.return_value = {
        "jti": "some_jti",
        "user_id": "user_101",
        "expiresAt": int(time.time()) - 10,
        "revoked": False
    }
    mock_session_ref = MagicMock()
    mock_session_ref.document.return_value.get.return_value = mock_session_doc
    db_mock.collection.side_effect = None
    db_mock.collection.return_value = mock_session_ref

    with pytest.raises(Exception) as exc_info:
        utils.security.original_verify_jwt_token(token)
    assert "Session expired" in str(exc_info.value)
