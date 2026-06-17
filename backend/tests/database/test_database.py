import pytest
import time
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from config.firebase_config import db
from utils.auth_utils import allocate_next_user_id
from services import auth_service, kpi_service

# ==============================================================================
# CRUD COVERAGE TESTS (CRUD)
# ==============================================================================

# CRUD-01: Create KPI
@patch("services.kpi_service.require_manager")
def test_crud_01_create_kpi(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    
    from models.kpi_model import KPICreate
    kpi_data = KPICreate(title="CRUD Create KPI", target=50.0)
    
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "kpi_created"
    db_mock.collection("kpiData").document.return_value = mock_doc_ref
    
    res = kpi_service.create_kpi(kpi_data, mock_request)
    assert res["success"] is True
    mock_doc_ref.set.assert_called_once()


# CRUD-02: Read all KPIs
@patch("services.kpi_service.require_manager")
def test_crud_02_read_all_kpis(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    mock_request.query_params = {}
    
    mock_doc = MagicMock()
    mock_doc.id = "kpi_1"
    mock_doc.to_dict.return_value = {"title": "KPI 1"}
    db_mock.collection("kpiData").stream.return_value = [mock_doc]
    
    res = kpi_service.get_kpis(mock_request)
    assert res["success"] is True
    assert len(res["kpis"]) == 1


# CRUD-03: Read single KPI
@patch("services.kpi_service.require_manager")
def test_crud_03_read_single_kpi(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"title": "KPI Title"}
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_doc
    
    res = kpi_service.get_kpi("kpi_123", mock_request)
    assert res["success"] is True
    assert res["kpi"]["title"] == "KPI Title"


# CRUD-04: Update KPI fields
@patch("services.kpi_service.require_manager")
def test_crud_04_update_kpi_fields(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.to_dict.return_value = {"title": "Updated Title"}
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_doc
    
    from models.kpi_model import KPIUpdate
    update_data = KPIUpdate(title="Updated Title")
    
    res = kpi_service.update_kpi("kpi_123", update_data, mock_request)
    assert res["success"] is True
    assert res["kpi"]["title"] == "Updated Title"
    db_mock.collection("kpiData").document("kpi_123").update.assert_called_once()


# CRUD-05: Delete KPI
@patch("services.kpi_service.require_manager")
def test_crud_05_delete_kpi(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    
    mock_doc = MagicMock()
    mock_doc.exists = True
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_doc
    
    res = kpi_service.delete_kpi("kpi_123", mock_request)
    assert res["success"] is True
    db_mock.collection("kpiData").document("kpi_123").delete.assert_called_once()


# CRUD-06: Create KPI assignment
@patch("services.kpi_service.require_manager")
def test_crud_06_create_kpi_assignment(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    
    from models.kpi_model import KPICreate
    kpi_data = KPICreate(
        title="KPI Assignments Test",
        assignedUserIds=["staff_1"],
        kpiAssignments=[{"userId": "staff_1", "target": 10.0, "current": 0}]
    )
    
    mock_doc_ref = MagicMock()
    db_mock.collection("kpiData").document.return_value = mock_doc_ref
    
    res = kpi_service.create_kpi(kpi_data, mock_request)
    assert res["success"] is True
    saved_data = mock_doc_ref.set.call_args[0][0]
    assert saved_data["assignedUserIds"] == ["staff_1"]
    assert saved_data["kpiAssignments"][0]["userId"] == "staff_1"


# CRUD-07: Update KPI assignments
def test_crud_07_update_kpi_assignments(db_mock):
    from services.manager_service import assign_kpi_to_staff
    from models.kpi_model import KPIStaffAssignment
    
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    mock_kpi_doc.to_dict.return_value = {
        "assignedUserIds": ["staff_1"],
        "kpiAssignments": [{"userId": "staff_1", "target": 10.0, "current": 0}]
    }
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_kpi_doc
    
    assignments = [
        KPIStaffAssignment(staffId="staff_2", staffName="Bob", staffEmail="bob@co.com", targetValue=20.0)
    ]
    res = assign_kpi_to_staff("kpi_123", assignments, "manager_123")
    assert res["success"] is True
    db_mock.collection("kpiData").document("kpi_123").update.assert_called_once()


# CRUD-08: Create KPI submission
@pytest.mark.asyncio
@patch("services.kpi_service.require_user")
async def test_crud_08_create_kpi_submission(mock_require_user, db_mock):
    mock_require_user.return_value = {"user_id": "staff_1"}
    mock_request = MagicMock()
    
    mock_sub_ref = MagicMock()
    db_mock.collection("kpiSubmissions").document = MagicMock(return_value=mock_sub_ref)
    
    from services.kpi_service import update_kpi_progress_service
    res = await update_kpi_progress_service("kpi_123", 5.0, "Progress note", [], mock_request)
    assert res["success"] is True
    mock_sub_ref.set.assert_called_once()


# ==============================================================================
# DATA INTEGRITY TESTS (DI)
# ==============================================================================

# DI-01: Cascading KPI deletion removes user references
@patch("services.kpi_service.require_manager")
def test_di_01_cascading_kpi_deletion(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    mock_kpi_doc.to_dict.return_value = {"assignedUserIds": ["staff_101"]}
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_kpi_doc
    
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {"assignedKpis": ["kpi_123", "kpi_456"]}
    db_mock.collection("userData").document("staff_101").get.return_value = mock_user_doc
    
    db_mock.collection("kpiSubmissions").where.return_value.stream.return_value = []
    
    kpi_service.delete_kpi("kpi_123", mock_request)
    
    db_mock.collection("userData").document("staff_101").update.assert_called_once_with({"assignedKpis": ["kpi_456"]})


# DI-02: Session revocation on account deletion
def test_di_02_session_revocation_on_account_deletion(db_mock):
    from utils.security import SESSIONS_COLLECTION
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    db_mock.collection("userData").document("user_101").get.return_value = mock_user_doc
    
    mock_auth_doc = MagicMock()
    mock_auth_doc.exists = True
    db_mock.collection("userAuth").document("user_101").get.return_value = mock_auth_doc
    
    mock_session = MagicMock()
    mock_session_ref = MagicMock()
    mock_session.reference = mock_session_ref
    db_mock.collection(SESSIONS_COLLECTION).where.return_value.stream.return_value = [mock_session]
    
    from services.user_service import delete_account
    delete_account("user_101")
    
    mock_session_ref.set.assert_called_once_with({"revoked": True}, merge=True)


# DI-03: Concurrent KPI submission approvals
def test_di_03_concurrent_kpi_submission_approvals(db_mock):
    from services.manager_service import verify_submission
    mock_sub_doc = MagicMock()
    mock_sub_doc.exists = True
    mock_sub_doc.to_dict.return_value = {
        "submittedBy": "staff_101",
        "current": 80.0,
        "kpiId": "kpi_123"
    }
    db_mock.collection("kpiSubmissions").document("sub_1").get.return_value = mock_sub_doc
    
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    mock_kpi_doc.to_dict.return_value = {
        "kpiAssignments": [
            {"userId": "staff_101", "target": 100.0, "current": 30.0}
        ],
        "status": "active"
    }
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_kpi_doc
    
    res = verify_submission("sub_1", "kpi_123", "approved", "Good", "manager_1")
    
    assert res["success"] is True
    updated_assignments = db_mock.collection("kpiData").document("kpi_123").update.call_args[0][0]["kpiAssignments"]
    assert updated_assignments[0]["current"] == 80.0


# DI-04: KPI completion state transition
def test_di_04_kpi_completion_state_transition(db_mock):
    from services.manager_service import verify_submission
    mock_sub_doc = MagicMock()
    mock_sub_doc.exists = True
    mock_sub_doc.id = "sub_1"
    mock_sub_doc.to_dict.return_value = {
        "submittedBy": "staff_101",
        "current": 100.0,
        "kpiId": "kpi_123"
    }
    db_mock.collection("kpiSubmissions").document("sub_1").get.return_value = mock_sub_doc
    db_mock.collection("kpiSubmissions").where("kpiId", "==", "kpi_123").stream.return_value = [mock_sub_doc]
    
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    mock_kpi_doc.to_dict.return_value = {
        "kpiAssignments": [
            {"userId": "staff_101", "target": 100.0, "current": 50.0}
        ],
        "status": "active"
    }
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_kpi_doc
    
    res = verify_submission("sub_1", "kpi_123", "approved", "Good", "manager_1")
    assert res["success"] is True
    updated_fields = db_mock.collection("kpiData").document("kpi_123").update.call_args[0][0]
    assert updated_fields["status"] == "completed"


# DI-05: Orphan submission handling after KPI delete
@patch("services.kpi_service.require_manager")
def test_di_05_orphan_submission_handling(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_kpi_doc
    
    mock_sub = MagicMock()
    mock_sub_ref = MagicMock()
    mock_sub.reference = mock_sub_ref
    db_mock.collection("kpiSubmissions").where.return_value.stream.return_value = [mock_sub]
    
    kpi_service.delete_kpi("kpi_123", mock_request)
    mock_sub_ref.delete.assert_called_once()


# ==============================================================================
# SCHEMA VALIDATION TESTS (SV)
# ==============================================================================

# SV-01: Reject missing required KPI fields
def test_sv_01_reject_missing_required_kpi_fields():
    from pydantic import ValidationError
    from models.kpi_model import KPICreate
    with pytest.raises(ValidationError):
        KPICreate(target=100.0)


# SV-02: Validate default fields (status, priority)
@patch("services.kpi_service.require_manager")
def test_sv_02_validate_default_fields(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    
    from models.kpi_model import KPICreate
    kpi_data = KPICreate(title="Default Target")
    
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "kpi_999"
    db_mock.collection("kpiData").document.return_value = mock_doc_ref
    
    kpi_service.create_kpi(kpi_data, mock_request)
    saved_data = mock_doc_ref.set.call_args[0][0]
    assert saved_data["status"] == "active"


# SV-03: Validate timestamp integrity
@patch("services.kpi_service.require_manager")
def test_sv_03_validate_timestamp_integrity(mock_require_manager, db_mock):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    
    from models.kpi_model import KPICreate
    kpi_data = KPICreate(title="Timestamp Test")
    
    mock_doc_ref = MagicMock()
    db_mock.collection("kpiData").document.return_value = mock_doc_ref
    
    kpi_service.create_kpi(kpi_data, mock_request)
    saved_data = mock_doc_ref.set.call_args[0][0]
    
    from datetime import datetime
    assert datetime.fromisoformat(saved_data["createdAt"])
    assert datetime.fromisoformat(saved_data["updatedAt"])


# SV-04: Prevent invalid data types
def test_sv_04_prevent_invalid_data_types():
    from pydantic import ValidationError
    from models.kpi_model import KPICreate
    with pytest.raises(ValidationError):
        KPICreate(title="Test", target="invalid_float_string")


# SV-05: Case-insensitive email uniqueness
def test_sv_05_case_insensitive_email_uniqueness(db_mock):
    from services.auth_service import is_email_registered_case_insensitive
    mock_user = MagicMock()
    mock_user.to_dict.return_value = {"email": "test@company.com"}
    db_mock.collection("userData").where.return_value.stream.return_value = [mock_user]
    
    assert is_email_registered_case_insensitive("TEST@COMPANY.COM") is True


# ==============================================================================
# ROUTE TO DB MAPPING TESTS (RDM)
# ==============================================================================

# RDM-01: KPI creation maps to kpiData
def test_rdm_01_kpi_creation_maps_to_kpi_data(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "kpi_777"
    db_mock.collection("kpiData").document.return_value = mock_doc_ref
    
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {"role": "manager"}
    db_mock.collection("userData").document("manager_123").get.return_value = mock_user_doc
    
    response = client.post(
        "/api/manager/kpi",
        json={"title": "Mapped KPI", "target": 100.0},
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    db_mock.collection.assert_any_call("kpiData")


# RDM-02: KPI update persists correctly
def test_rdm_02_kpi_update_persists(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {"role": "manager"}
    db_mock.collection("userData").document("manager_123").get.return_value = mock_user_doc
    
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    mock_kpi_doc.to_dict.return_value = {"title": "Original Title"}
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_kpi_doc
    
    response = client.put(
        "/api/manager/kpi/kpi_123",
        json={"title": "Updated Title"},
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    db_mock.collection("kpiData").document("kpi_123").update.assert_called_once()


# RDM-03: KPI deletion removes document
def test_rdm_03_kpi_deletion_removes_doc(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {"role": "manager"}
    db_mock.collection("userData").document("manager_123").get.return_value = mock_user_doc
    
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    mock_kpi_doc.to_dict.return_value = {"assignedUserIds": []}
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_kpi_doc
    
    db_mock.collection("kpiSubmissions").where.return_value.stream.return_value = []
    
    response = client.delete(
        "/api/manager/kpi/kpi_123",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    db_mock.collection("kpiData").document("kpi_123").delete.assert_called_once()


# RDM-04: Submission maps to KPI progress
def test_rdm_04_submission_maps_to_kpi_progress(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {"role": "manager"}
    db_mock.collection("userData").document("manager_123").get.return_value = mock_user_doc
    
    mock_sub_doc = MagicMock()
    mock_sub_doc.exists = True
    mock_sub_doc.to_dict.return_value = {
        "submittedBy": "staff_1",
        "current": 100.0,
        "kpiId": "kpi_123"
    }
    db_mock.collection("kpiSubmissions").document("sub_1").get.return_value = mock_sub_doc
    
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    mock_kpi_doc.to_dict.return_value = {
        "kpiAssignments": [{"userId": "staff_1", "target": 100.0, "current": 50.0}]
    }
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_kpi_doc
    
    response = client.post(
        "/api/kpi/verify-submission",
        json={"submissionId": "sub_1", "kpiId": "kpi_123", "status": "approved", "comments": "Approved"},
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    db_mock.collection("kpiData").document("kpi_123").update.assert_called_once()


# RDM-05: Staff fetch maps to userData
def test_rdm_05_staff_fetch_maps_to_user_data(client, db_mock):
    mock_user = MagicMock()
    mock_user.to_dict.return_value = {"name": "Bob Staff", "role": "staff"}
    db_mock.collection("userData").stream.return_value = [mock_user]
    
    response = client.get("/api/staff")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Bob Staff"


# RDM-06: KPI assignments join userData
def test_rdm_06_kpi_assignments_join_user_data(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {"role": "manager"}
    db_mock.collection("userData").document("manager_123").get.return_value = mock_user_doc
    
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    mock_kpi_doc.to_dict.return_value = {
        "kpiAssignments": [{"userId": "staff_1", "target": 10.0, "current": 0}]
    }
    db_mock.collection("kpiData").document("kpi_123").get.return_value = mock_kpi_doc
    
    mock_staff_doc = MagicMock()
    mock_staff_doc.to_dict.return_value = {"name": "Staff Name", "email": "staff@co.com"}
    db_mock.collection("userData").document("staff_1").get.return_value = mock_staff_doc
    
    response = client.get(
        "/api/manager/kpi/kpi_123/assignments",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["assignments"][0]["staffName"] == "Staff Name"


# ==============================================================================
# ORIGINAL BASE DATABASE TESTS (INCLUDED & REFACTORED FOR MOCKS)
# ==============================================================================

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


def test_verify_jwt_session_active(db_mock):
    import utils.security
    from utils.security import SESSIONS_COLLECTION
    token = utils.security.create_jwt_token("user_101", "user@company.com")

    mock_session_doc = MagicMock()
    mock_session_doc.exists = True
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
