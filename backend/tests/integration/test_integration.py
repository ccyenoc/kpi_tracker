import pytest
import time
import os
import uuid
import secrets
import hashlib
from unittest.mock import patch, MagicMock
from fastapi import Request
from fastapi.testclient import TestClient

from main import app
import utils.security
from utils.security import create_jwt_token, SESSIONS_COLLECTION
from services.auth_service import EMAIL_VERIFICATION_COLLECTION, hash_verification_code
from firebase_secure import KPI_COLLECTION, USERDATA_COLLECTION, USERAUTH_COLLECTION

client = TestClient(app)

# ==========================================
# IN-MEMORY FIRESTORE MOCK ENGINE
# ==========================================

class MockFirestoreDB:
    def __init__(self):
        self.data = {}  # collection_name -> document_id -> data_dict

    def collection(self, name):
        if name not in self.data:
            self.data[name] = {}
        return MockCollection(self, name)

    def transaction(self):
        return MockTransaction(self)

class MockTransaction:
    def __init__(self, db):
        self.db = db

    def set(self, doc_ref, data, merge=False):
        doc_ref.set(data, merge)

    def update(self, doc_ref, data):
        doc_ref.update(data)

    def delete(self, doc_ref):
        doc_ref.delete()

class MockCollection:
    def __init__(self, db, name):
        self.db = db
        self.name = name
        self.filters = []

    def document(self, doc_id=None):
        if doc_id is None:
            doc_id = f"mock_doc_{uuid.uuid4().hex[:8]}"
        return MockDocumentReference(self.db, self.name, doc_id)

    def where(self, *args, **kwargs):
        filters = list(self.filters)
        if "filter" in kwargs:
            ff = kwargs["filter"]
            field_path = getattr(ff, "field_path", None)
            op = getattr(ff, "op_string", None) or getattr(ff, "op", "==")
            value = getattr(ff, "value", None)
            filters.append((field_path, op, value))
        elif len(args) >= 3:
            filters.append((args[0], args[1], args[2]))
        
        mq = MockQuery(self.db, self.name, filters)
        return mq

    def limit(self, num):
        return self

    def stream(self):
        docs = []
        for doc_id, doc_data in self.db.data.get(self.name, {}).items():
            docs.append(MockDocumentSnapshot(self.db, self.name, doc_id, doc_data))
        return docs

class MockQuery:
    def __init__(self, db, name, filters):
        self.db = db
        self.name = name
        self.filters = filters

    def where(self, *args, **kwargs):
        new_filters = list(self.filters)
        if "filter" in kwargs:
            ff = kwargs["filter"]
            field_path = getattr(ff, "field_path", None)
            op = getattr(ff, "op_string", None) or getattr(ff, "op", "==")
            value = getattr(ff, "value", None)
            new_filters.append((field_path, op, value))
        elif len(args) >= 3:
            new_filters.append((args[0], args[1], args[2]))
        return MockQuery(self.db, self.name, new_filters)

    def limit(self, num):
        return self

    def stream(self):
        results = []
        for doc_id, doc_data in self.db.data.get(self.name, {}).items():
            match = True
            for field, operator, value in self.filters:
                val = doc_data.get(field)
                if operator == "==":
                    if val != value:
                        match = False
                elif operator == "array_contains":
                    if not isinstance(val, list) or value not in val:
                        match = False
            if match:
                results.append(MockDocumentSnapshot(self.db, self.name, doc_id, doc_data))
        return results

class MockDocumentReference:
    def __init__(self, db, collection_name, doc_id):
        self.db = db
        self.collection_name = collection_name
        self.id = doc_id

    def get(self):
        doc_data = self.db.data.get(self.collection_name, {}).get(self.id)
        if doc_data is None:
            snap = MockDocumentSnapshot(self.db, self.collection_name, self.id, None)
            snap.exists = False
            return snap
        snap = MockDocumentSnapshot(self.db, self.collection_name, self.id, doc_data)
        snap.exists = True
        return snap

    def set(self, data, merge=False):
        if self.collection_name not in self.db.data:
            self.db.data[self.collection_name] = {}
        if hasattr(data, "dict"):
            data_dict = data.dict()
        elif hasattr(data, "model_dump"):
            data_dict = data.model_dump()
        else:
            data_dict = dict(data)
            
        if merge and self.id in self.db.data[self.collection_name]:
            self.db.data[self.collection_name][self.id].update(data_dict)
        else:
            self.db.data[self.collection_name][self.id] = data_dict

    def update(self, data):
        if self.collection_name not in self.db.data or self.id not in self.db.data[self.collection_name]:
            if self.collection_name not in self.db.data:
                self.db.data[self.collection_name] = {}
            self.db.data[self.collection_name][self.id] = {}
        self.db.data[self.collection_name][self.id].update(data)

    def delete(self):
        if self.collection_name in self.db.data and self.id in self.db.data[self.collection_name]:
            del self.db.data[self.collection_name][self.id]

    def create(self, data):
        if self.collection_name in self.db.data and self.id in self.db.data[self.collection_name]:
            from google.api_core.exceptions import AlreadyExists
            raise AlreadyExists("Document already exists")
        self.set(data)

class MockDocumentSnapshot:
    def __init__(self, db, collection_name, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = data is not None
        self.reference = MockDocumentReference(db, collection_name, doc_id)

    def to_dict(self):
        return self._data

@pytest.fixture
def in_memory_db(db_mock):
    db = MockFirestoreDB()
    def spy_collection(name):
        print(f"DEBUG_COLL: {name}")
        return db.collection(name)
    db_mock.collection.side_effect = spy_collection
    db_mock.transaction.side_effect = db.transaction
    return db


# ==========================================
# 1. AUTHENTICATION MODULE INTEGRATION TESTS
# ==========================================

# INT-01-A: Token verification integrates with session database persistence (Active Session)
def test_verify_jwt_session_integration_active(in_memory_db):
    token = create_jwt_token("user_101", "user@company.com")
    payload = utils.security.jwt.decode(token, utils.security.SECRET_KEY, algorithms=["HS256"])
    jti = payload["jti"]

    in_memory_db.data[SESSIONS_COLLECTION] = {
        jti: {
            "jti": jti,
            "user_id": "user_101",
            "expiresAt": int(time.time()) + 3600,
            "revoked": False
        }
    }

    decoded = utils.security.original_verify_jwt_token(token)
    assert decoded["user_id"] == "user_101"
    assert decoded["email"] == "user@company.com"


# INT-01-B: Token verification integrates with session database and blocks revoked sessions
def test_verify_jwt_session_integration_revoked(in_memory_db):
    token = create_jwt_token("user_101", "user@company.com")
    payload = utils.security.jwt.decode(token, utils.security.SECRET_KEY, algorithms=["HS256"])
    jti = payload["jti"]

    in_memory_db.data[SESSIONS_COLLECTION] = {
        jti: {
            "jti": jti,
            "user_id": "user_101",
            "expiresAt": int(time.time()) + 3600,
            "revoked": True
        }
    }

    with pytest.raises(Exception) as exc_info:
        utils.security.original_verify_jwt_token(token)
    assert "Session revoked" in str(exc_info.value)


# INT-01-C: Token verification integrates with session database and blocks expired sessions
def test_verify_jwt_session_integration_expired(in_memory_db):
    token = create_jwt_token("user_101", "user@company.com")
    payload = utils.security.jwt.decode(token, utils.security.SECRET_KEY, algorithms=["HS256"])
    jti = payload["jti"]

    in_memory_db.data[SESSIONS_COLLECTION] = {
        jti: {
            "jti": jti,
            "user_id": "user_101",
            "expiresAt": int(time.time()) - 10,
            "revoked": False
        }
    }

    with pytest.raises(Exception) as exc_info:
        utils.security.original_verify_jwt_token(token)
    assert "Session expired" in str(exc_info.value)


# INT-01-D: Session invalidation integrates with logout endpoint and updates Firestore database
def test_logout_invalidation_integration(client, in_memory_db):
    token = create_jwt_token("user_101", "user@company.com")
    payload = utils.security.jwt.decode(token, utils.security.SECRET_KEY, algorithms=["HS256"])
    jti = payload["jti"]

    in_memory_db.data[SESSIONS_COLLECTION] = {
        jti: {
            "jti": jti,
            "user_id": "user_101",
            "expiresAt": int(time.time()) + 3600,
            "revoked": False
        }
    }

    # Execute logout request
    response = client.post(
        "/api/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify session has been marked as revoked in database
    assert in_memory_db.data[SESSIONS_COLLECTION][jti]["revoked"] is True

    # Verify subsequent verification calls fail
    with pytest.raises(Exception) as exc_info:
        utils.security.original_verify_jwt_token(token)
    assert "Session revoked" in str(exc_info.value)


# INT-01-E: Email verification flow integration (sending verification email code & checking hashes in Firestore)
@patch("services.auth_service.send_email_verification_message")
@patch("services.auth_service.generate_verification_code", return_value="123456")
def test_email_verification_flow_integration(mock_gen, mock_send, client, in_memory_db):
    payload = {"email": "newuser@company.com"}
    response = client.post("/api/verify-email", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Verify verification code details were written to Firestore
    normalized_email = "newuser@company.com"
    verification_record = in_memory_db.data[EMAIL_VERIFICATION_COLLECTION][normalized_email]
    assert verification_record["verified"] is False
    assert "codeHash" in verification_record

    # Verify the code using verify-code route
    verify_payload = {"email": "newuser@company.com", "code": "123456"}
    response = client.post("/api/verify-code", json=verify_payload)
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Check database was updated to verified = True
    assert in_memory_db.data[EMAIL_VERIFICATION_COLLECTION][normalized_email]["verified"] is True


# INT-01-F: Email verification checks for invalid and expired codes
def test_email_verification_invalid_and_expired(client, in_memory_db):
    normalized_email = "expireduser@company.com"
    salt = "somesalt123"
    code = "123456"
    code_hash = hash_verification_code(normalized_email, code, salt)

    # Prepopulate expired code in Firestore
    in_memory_db.data[EMAIL_VERIFICATION_COLLECTION] = {
        normalized_email: {
            "email": normalized_email,
            "codeHash": code_hash,
            "codeSalt": salt,
            "expiresAt": int(time.time()) - 10,
            "verified": False,
            "createdAt": int(time.time()) - 100
        }
    }

    # Verify code verification fails for expired codes
    response = client.post("/api/verify-code", json={"email": normalized_email, "code": code})
    assert response.status_code == 400
    assert "expired" in response.json()["detail"].lower()

    # Prepopulate active verification code
    in_memory_db.data[EMAIL_VERIFICATION_COLLECTION][normalized_email]["expiresAt"] = int(time.time()) + 600

    # Verify code verification fails for mismatched codes
    response = client.post("/api/verify-code", json={"email": normalized_email, "code": "000000"})
    assert response.status_code == 400
    assert "invalid" in response.json()["detail"].lower()


# ==========================================
# 2. MANAGER MODULE INTEGRATION TESTS
# ==========================================

# INT-02-A: Manager KPI creation route integrates with role validation, Firestore and assignment email triggers
@patch("services.kpi_service.send_kpi_assignment_email")
def test_manager_create_kpi_smtp_integration(mock_send_email, client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}

    # Setup manager user data & staff user data
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@company.com"},
        "staff_101": {"role": "staff", "name": "John Staff", "email": "john@company.com"}
    }

    payload = {
        "title": "Boost Sales Target",
        "description": "Increase team sales numbers",
        "categoryId": "sales",
        "categoryName": "Sales Performance",
        "target": 150.0,
        "unit": "USD",
        "frequency": "monthly",
        "deadline": "2026-07-31T00:00:00.000Z",
        "assignedUserIds": ["staff_101"],
        "kpiAssignments": []
    }

    response = client.post(
        "/api/manager/kpi",
        json=payload,
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Assert KPI document is saved in in-memory database
    kpis = in_memory_db.data[KPI_COLLECTION]
    assert len(kpis) == 1
    kpi_doc = list(kpis.values())[0]
    assert kpi_doc["title"] == "Boost Sales Target"

    # Assert creation triggered assignment SMTP email to the assigned staff member
    mock_send_email.assert_called_once_with(
        to_email="john@company.com",
        staff_name="John Staff",
        kpi_title="Boost Sales Target",
        deadline="2026-07-31T00:00:00.000Z"
    )


# INT-02-B: Manager updates details of an existing KPI
def test_manager_update_kpi_integration(client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@company.com"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_999": {
            "title": "Old Title",
            "description": "Old Desc",
            "target": 50.0,
            "deadline": "2026-06-30T00:00:00.000Z",
            "assignedUserIds": [],
            "kpiAssignments": [],
            "status": "active",
            "createdBy": "manager_123"
        }
    }

    update_payload = {
        "title": "New Title",
        "description": "New Desc",
        "target": 200.0,
        "deadline": "2026-08-31T00:00:00.000Z",
        "assignedUserIds": [],
        "kpiAssignments": []
    }

    response = client.put(
        "/api/manager/kpi/kpi_999",
        json=update_payload,
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert in_memory_db.data[KPI_COLLECTION]["kpi_999"]["title"] == "New Title"
    assert in_memory_db.data[KPI_COLLECTION]["kpi_999"]["target"] == 200.0


# INT-02-C: Manager deletes an existing KPI
def test_manager_delete_kpi_integration(client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@company.com"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_999": {
            "title": "KPI to delete",
            "status": "active",
            "createdBy": "manager_123"
        }
    }

    response = client.delete(
        "/api/manager/kpi/kpi_999",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "kpi_999" not in in_memory_db.data[KPI_COLLECTION]


# INT-02-D: Manager verifies staff submission (Approval), updates progress metrics and resolves KPI completeness
@patch("services.kpi_service.send_email")
def test_manager_verify_submission_approval_sync(mock_send_email, client, in_memory_db, jwt_mock, db_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}

    # Setup database with staff, manager, kpi, and submission records
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@company.com"},
        "staff_101": {"role": "staff", "name": "John Staff", "email": "john@company.com"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_123": {
            "title": "Sales target",
            "target": 100.0,
            "status": "active",
            "createdBy": "manager_123",
            "kpiAssignments": [
                {"userId": "staff_101", "target": 100.0, "current": 0.0}
            ]
        }
    }
    in_memory_db.data["kpiSubmissions"] = {
        "sub_001": {
            "id": "sub_001",
            "kpiId": "kpi_123",
            "current": 100.0,
            "status": "pending",
            "submittedBy": "staff_101"
        }
    }

    verify_payload = {
        "submissionId": "sub_001",
        "kpiId": "kpi_123",
        "status": "approved",
        "comments": "Completed successfully!"
    }

    print("KPI IN DB:", in_memory_db.data[KPI_COLLECTION].get("kpi_123"))
    print("SUBMISSION IN DB:", in_memory_db.data.get("kpiSubmissions", {}).get("sub_001"))
    from config.firebase_config import db as config_db
    print("config_db is db_mock:", config_db is db_mock)
    from firebase_admin import firestore
    print("firestore.client() is db_mock:", firestore.client() is db_mock)
    response = client.post(
        "/api/kpi/verify-submission",
        json=verify_payload,
        headers={"Authorization": "Bearer valid_token"}
    )
    print("JSON:", response.json())
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Check status of the submission is updated
    assert in_memory_db.data["kpiSubmissions"]["sub_001"]["status"] == "approved"

    # Check progress inside the KPI assignment is synchronized
    kpi_doc = in_memory_db.data[KPI_COLLECTION]["kpi_123"]
    assert kpi_doc["kpiAssignments"][0]["current"] == 100.0

    # Verify KPI status is automatically set to completed since all staff reached their targets
    assert kpi_doc["status"] == "completed"

    # Verify email is sent to staff
    mock_send_email.assert_called_once_with(
        "john@company.com",
        "KPI Submission APPROVED",
        "Hi John Staff,\n\nYour KPI submission for \"Sales target\" has been APPROVED.\n\nManager's Comments:\nCompleted successfully!\n\nThank you,\nKPI System"
    )


# INT-02-E: Manager verifies staff submission (Rejection) and leaves progress metrics unchanged
@patch("services.kpi_service.send_email")
def test_manager_verify_submission_rejection(mock_send_email, client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@company.com"},
        "staff_101": {"role": "staff", "name": "John Staff", "email": "john@company.com"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_123": {
            "title": "Sales target",
            "target": 100.0,
            "status": "active",
            "createdBy": "manager_123",
            "kpiAssignments": [
                {"userId": "staff_101", "target": 100.0, "current": 0.0}
            ]
        }
    }
    in_memory_db.data["kpiSubmissions"] = {
        "sub_001": {
            "id": "sub_001",
            "kpiId": "kpi_123",
            "current": 100.0,
            "status": "pending",
            "submittedBy": "staff_101"
        }
    }

    verify_payload = {
        "submissionId": "sub_001",
        "kpiId": "kpi_123",
        "status": "rejected",
        "comments": "Please submit correct evidence."
    }

    response = client.post(
        "/api/kpi/verify-submission",
        json=verify_payload,
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Check status of the submission is rejected
    assert in_memory_db.data["kpiSubmissions"]["sub_001"]["status"] == "rejected"

    # KPI progress should remain unchanged
    kpi_doc = in_memory_db.data[KPI_COLLECTION]["kpi_123"]
    assert kpi_doc["kpiAssignments"][0]["current"] == 0.0
    assert kpi_doc["status"] == "active"

    # Verify email is sent to staff
    mock_send_email.assert_called_once_with(
        "john@company.com",
        "KPI Submission REJECTED",
        "Hi John Staff,\n\nYour KPI submission for \"Sales target\" has been REJECTED.\n\nManager's Comments:\nPlease submit correct evidence.\n\nThank you,\nKPI System"
    )


# INT-02-F: Manager dashboard statistics retrieves aggregated statistics and top staff rankings
def test_manager_dashboard_stats_aggregation(client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    in_memory_db.data[USERDATA_COLLECTION] = {
        "staff_1": {"name": "Staff Alpha", "department": "Sales", "email": "alpha@company.com"},
        "staff_2": {"name": "Staff Beta", "department": "Sales", "email": "beta@company.com"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_1": {
            "status": "active",
            "kpiAssignments": [
                {"userId": "staff_1", "target": 100.0, "current": 50.0},
                {"userId": "staff_2", "target": 100.0, "current": 90.0}
            ]
        },
        "kpi_2": {
            "status": "completed",
            "kpiAssignments": []
        }
    }

    response = client.get(
        "/api/manager/dashboard/stats",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    stats = data["dashboardStats"]
    assert stats["totalKPIs"] == 2
    assert stats["activeKPIs"] == 1
    assert stats["completedKPIs"] == 1

    # Check rankings order (Beta achievement rate = 90% is higher than Alpha = 50%)
    rankings = data["staffRankings"]
    assert rankings[0]["staffId"] == "staff_2"
    assert rankings[1]["staffId"] == "staff_1"


# INT-02-G: Manager retrieves list of all KPIs and a single KPI details
def test_manager_list_and_get_kpis_integration(client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@co.com"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_111": {
            "title": "First KPI",
            "status": "active"
        }
    }
    # 1. Test listing KPIs
    response = client.get(
        "/api/manager/kpis",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert len(response.json()["kpis"]) == 1
    assert response.json()["kpis"][0]["title"] == "First KPI"

    # 2. Test reading single KPI details
    response = client.get(
        "/api/manager/kpi/kpi_111",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["kpi"]["title"] == "First KPI"


# INT-02-H: Manager assigns a KPI to staff, writing assignments to kpiData and userData collections
def test_manager_assign_kpi_to_staff_integration(client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@co.com"},
        "staff_101": {"role": "staff", "name": "John Staff", "email": "john@co.com", "assignedKpis": []}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_111": {
            "title": "Unassigned KPI",
            "assignedUserIds": [],
            "kpiAssignments": []
        }
    }
    
    payload = {
        "kpiId": "kpi_111",
        "assignments": [
            {
                "staffId": "staff_101",
                "staffName": "John Staff",
                "staffEmail": "john@co.com",
                "targetValue": 500.0
            }
        ]
    }
    
    response = client.post(
        "/api/manager/kpi/kpi_111/assign",
        json=payload,
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    
    # Check kpiData update
    kpi_doc = in_memory_db.data[KPI_COLLECTION]["kpi_111"]
    assert "staff_101" in kpi_doc["assignedUserIds"]
    assert kpi_doc["kpiAssignments"][0]["target"] == 500.0
    
    # Check userData update
    staff_doc = in_memory_db.data[USERDATA_COLLECTION]["staff_101"]
    assert "kpi_111" in staff_doc["assignedKpis"]


# INT-02-I: Manager retrieves individual assignments for a given KPI joined with user profiles
def test_manager_get_assignments_integration(client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@co.com"},
        "staff_101": {"role": "staff", "name": "John Staff", "email": "john@co.com"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_111": {
            "title": "KPI with assignments",
            "kpiAssignments": [
                {"userId": "staff_101", "target": 250.0, "current": 10.0, "assignedAt": "2026-06-01T00:00:00"}
            ]
        }
    }
    
    response = client.get(
        "/api/manager/kpi/kpi_111/assignments",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["assignments"][0]["staffName"] == "John Staff"
    assert data["assignments"][0]["targetValue"] == 250.0


# INT-02-J: Manager exports KPI report as CSV formatted content
def test_manager_export_report_csv_integration(client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@co.com"},
        "staff_101": {"role": "staff", "name": "John Staff", "email": "john@co.com"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_111": {
            "title": "CSV KPI",
            "kpiAssignments": [
                {"userId": "staff_101", "target": 100.0, "current": 75.0, "assignedAt": "2026-06-01T00:00:00"}
            ]
        }
    }
    
    response = client.get(
        "/api/manager/kpi/kpi_111/report/csv",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/csv; charset=utf-8"
    assert "attachment; filename=" in response.headers["content-disposition"]
    content = response.text
    assert "John Staff" in content
    assert "john@co.com" in content
    assert "75.0" in content


# INT-02-K: Manager views predicted outcome for a KPI based on time-based progress calculations
def test_manager_kpi_predict_integration(client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    in_memory_db.data[USERDATA_COLLECTION] = {
        "manager_123": {"role": "manager", "name": "Jane Manager", "email": "manager@co.com"},
        "staff_101": {"role": "staff", "name": "John Staff", "email": "john@co.com"}
    }
    
    import datetime
    now = datetime.datetime.now()
    created_at = (now - datetime.timedelta(days=10)).isoformat()
    deadline = (now + datetime.timedelta(days=20)).isoformat()
    
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_111": {
            "title": "Prediction KPI",
            "createdAt": created_at,
            "deadline": deadline,
            "kpiAssignments": [
                {"userId": "staff_101", "target": 100.0, "current": 50.0, "assignedAt": created_at}
            ]
        }
    }
    
    response = client.get(
        "/api/manager/kpi/kpi_111/predict",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["kpiId"] == "kpi_111"
    assert len(data["staffPredictions"]) == 1
    assert data["staffPredictions"][0]["currentProgress"] == 50.0


# INT-02-L: Automated categorization of KPIs into At-Risk and Underperforming states
def test_manager_risk_level_filters_integration(client, in_memory_db):
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_at_risk": {
            "title": "At Risk KPI",
            "status": "active",
            "kpiAssignments": [
                {"userId": "staff_1", "target": 100.0, "current": 70.0}
            ]
        },
        "kpi_underperforming": {
            "title": "Underperforming KPI",
            "status": "active",
            "kpiAssignments": [
                {"userId": "staff_1", "target": 100.0, "current": 30.0}
            ]
        }
    }
    
    response = client.get(
        "/api/kpi/at-risk",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["count"] == 1
    assert response.json()["kpis"][0]["id"] == "kpi_at_risk"
    
    response = client.get(
        "/api/kpi/underperform",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["count"] == 1
    assert response.json()["kpis"][0]["id"] == "kpi_underperforming"


# INT-02-M: Manager fetches directories of staff members for KPI selection dropdowns
def test_manager_get_all_staff_integration(client, in_memory_db):
    in_memory_db.data[USERDATA_COLLECTION] = {
        "user_1": {"name": "Staff Alice", "role": "staff", "email": "alice@co.com"},
        "user_2": {"name": "Manager Bob", "role": "manager", "email": "bob@co.com"}
    }
    
    response = client.get(
        "/api/staff",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    staff_list = response.json()
    assert len(staff_list) == 1
    assert staff_list[0]["name"] == "Staff Alice"


# ==========================================
# 3. STAFF MODULE INTEGRATION TESTS
# ==========================================

# INT-03-A: Staff member fetches only their assigned KPIs
def test_staff_get_assigned_kpis(client, in_memory_db, jwt_mock):
    # Authenticate as staff member
    jwt_mock.return_value = {"user_id": "staff_101"}
    
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_1": {
            "title": "KPI Assigned to staff_101",
            "assignedUserIds": ["staff_101"],
            "kpiAssignments": [{"userId": "staff_101", "target": 100}]
        },
        "kpi_2": {
            "title": "KPI Assigned to someone else",
            "assignedUserIds": ["staff_202"],
            "kpiAssignments": [{"userId": "staff_202", "target": 100}]
        }
    }

    response = client.get(
        "/api/staff/kpis",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    kpis = data["kpis"]
    assert len(kpis) == 1
    assert kpis[0]["title"] == "KPI Assigned to staff_101"


# INT-03-B: Staff progress submission persists document in Firestore and triggers dual SMTP notifications
@patch("services.kpi_service.send_email")
def test_staff_submit_progress_and_alerts(mock_send, client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "staff_101"}

    in_memory_db.data[USERDATA_COLLECTION] = {
        "staff_101": {"name": "John Staff", "email": "staff@company.com", "role": "staff"},
        "manager_123": {"name": "Jane Manager", "email": "manager@company.com", "role": "manager"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_123": {
            "title": "Sales target",
            "createdBy": "manager_123",
            "assignedUserIds": ["staff_101"]
        }
    }

    form_data = {
        "kpiId": "kpi_123",
        "current": 45.0,
        "notes": "Completed half of the deliverables."
    }

    response = client.post(
        "/api/kpi/update",
        data=form_data,
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True

    # Assert document is successfully written to database collection
    submissions = in_memory_db.data["kpiSubmissions"]
    assert len(submissions) == 1
    sub_doc = list(submissions.values())[0]
    assert sub_doc["current"] == 45.0
    assert sub_doc["submittedBy"] == "staff_101"
    assert sub_doc["status"] == "pending"

    # Assert 2 emails were sent (one notification to manager, one confirmation to staff)
    assert mock_send.call_count == 2
    recipients = [call.args[0] for call in mock_send.call_args_list]
    assert "manager@company.com" in recipients
    assert "staff@company.com" in recipients


# INT-03-C: Staff member retrieves historical performance records grouped by week/month
def test_staff_get_monthly_performance_history(client, in_memory_db, jwt_mock):
    jwt_mock.return_value = {"user_id": "staff_101"}
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_1": {
            "title": "Weekly Sales KPI",
            "assignedUserIds": ["staff_101"],
            "kpiAssignments": [{"userId": "staff_101", "target": 100.0, "current": 80.0}]
        }
    }
    # Prepopulate historical submission
    in_memory_db.data["kpiSubmissions"] = {
        "sub_1": {
            "kpiId": "kpi_1",
            "userId": "staff_101",
            "current": 80.0,
            "submittedAt": "2026-06-05T12:00:00.000Z"
        }
    }

    response = client.get(
        "/api/staff/monthly-performance",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) > 0
    assert data["data"][0]["progress"] == 80.0


# ==========================================
# 4. SYSTEM SERVICE MODULE INTEGRATION TESTS
# ==========================================

# INT-04-A: Weekly PDF report generation streams binary report data using real canvas and aggregated data
@patch("routes.report_routes.get_weekly_kpi")
def test_report_generator_weekly_pdf(mock_get_weekly, client, in_memory_db):
    in_memory_db.data[USERDATA_COLLECTION] = {
        "staff_101": {"name": "John Staff", "email": "staff@company.com"}
    }
    mock_get_weekly.return_value = {
        "summary": {"totalActiveKpis": 1, "totalAssignments": 1, "averageProgress": 50.0},
        "kpis": [
            {
                "title": "Sales target",
                "description": "Boost sales",
                "target": 100,
                "unit": "USD",
                "progress": 50.0,
                "kpiAssignments": [
                    {"userId": "staff_101", "target": 100, "current": 50, "progress": 50.0}
                ]
            }
        ]
    }

    response = client.get("/api/report/weekly")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "weekly_report.pdf" in response.headers["Content-Disposition"]
    assert len(response.content) > 0


# INT-04-B: Monthly PDF report generation streams binary report data
@patch("routes.report_routes.get_monthly_kpi")
def test_report_generator_monthly_pdf(mock_get_monthly, client, in_memory_db):
    in_memory_db.data[USERDATA_COLLECTION] = {
        "staff_101": {"name": "John Staff", "email": "staff@company.com"}
    }
    mock_get_monthly.return_value = {
        "summary": {"totalKpis": 1, "completedKpis": 0, "activeKpis": 1, "averageProgress": 30.0},
        "completed": [],
        "active": [
            {
                "title": "Active KPI",
                "description": "Description",
                "target": 100,
                "unit": "units",
                "progress": 30.0,
                "kpiAssignments": [
                    {"userId": "staff_101", "target": 100, "current": 30, "progress": 30.0}
                ]
            }
        ]
    }

    response = client.get("/api/report/monthly")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "monthly_report.pdf" in response.headers["Content-Disposition"]
    assert len(response.content) > 0


# INT-04-C: Personal monthly PDF performance report generation checks active token and user documents in Firestore
def test_report_generator_personal_pdf(client, in_memory_db, jwt_mock):
    # Mock token validation and current user payload
    jwt_mock.return_value = {"user_id": "staff_101"}

    in_memory_db.data[USERDATA_COLLECTION] = {
        "staff_101": {"name": "John Staff", "email": "staff@company.com", "role": "staff"}
    }
    in_memory_db.data[KPI_COLLECTION] = {
        "kpi_1": {
            "title": "My Sales Target",
            "target": 100.0,
            "status": "active",
            "kpiAssignments": [
                {"userId": "staff_101", "target": 100.0, "current": 75.0}
            ]
        }
    }

    # Verify endpoint fetches the staff member's assignments and builds a PDF
    response = client.get(
        "/api/report/monthly/me",
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=monthly_report_John_Staff.pdf" in response.headers["Content-Disposition"]
    assert len(response.content) > 0


# ==========================================
# 5. PROFILE MANAGEMENT MODULE INTEGRATION TESTS
# ==========================================

@pytest.fixture
def mock_db():
    db = MockFirestoreDB()
    # Seed Data for Profile Tests
    db.data[USERDATA_COLLECTION] = {
        "user_101": {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "123456789",
            "department": "Engineering",
            "role": "staff"
        },
        "user_102": {
            "name": "Jane Manager",
            "email": "jane@example.com",
            "role": "manager"
        }
    }
    db.data[USERAUTH_COLLECTION] = {
        "user_101": {
            "userId": "user_101",
            "password_hash": "hashed_old_password"
        }
    }
    db.data[SESSIONS_COLLECTION] = {
        "session_xyz": {
            "user_id": "user_101",
            "revoked": False
        }
    }
    return db

# INT-P01: Verify user can retrieve their profile details.
@patch("services.user_service.verify_jwt_token") 
@patch("services.user_service.db")
def test_int_p01_get_profile(mock_db_service, mock_verify_jwt, mock_db):
    mock_db_service.collection.side_effect = mock_db.collection
    mock_verify_jwt.return_value = {"user_id": "user_101"}

    response = client.get("/api/user", headers={"Authorization": "Bearer valid_token"})
    
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["user"]["name"] == "John Doe"
    assert response.json()["user"]["email"] == "john@example.com"

# INT-P02: Verify user can update profile fields and it persists in DB.
@patch("routes.user_routes.verify_jwt_token")
@patch("services.user_service.db")
@patch("services.user_service.save_user_profile_document")
def test_int_p02_update_profile(mock_save_profile, mock_db_service, mock_verify_jwt, mock_db):
    mock_db_service.collection.side_effect = mock_db.collection
    mock_verify_jwt.return_value = {"user_id": "user_101"}
    
    # Mock the save function to actually update our mock DB dict
    def mock_save(ref, updated_data):
        ref.update(updated_data)
    mock_save_profile.side_effect = mock_save

    payload = {
        "name": "Johnathan Doe",
        "phone": "987654321",
        "department": "HR"
    }

    response = client.put("/api/profile", json=payload, headers={"Authorization": "Bearer valid_token"})
    
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["user"]["name"] == "Johnathan Doe"
    
    # Verify DB was mutated
    updated_doc = mock_db.data[USERDATA_COLLECTION]["user_101"]
    assert updated_doc["phone"] == "987654321"
    assert updated_doc["department"] == "HR"

# INT-P03: Verify user can change their password with correct current password.
@patch("routes.user_routes.verify_jwt_token")
@patch("services.user_service.get_user_auth_hash")
@patch("services.user_service.verify_password")
@patch("services.user_service.hash_password")
@patch("services.user_service.save_user_auth_document")
def test_int_p03_update_password_success(mock_save_auth, mock_hash, mock_verify_pw, mock_get_hash, mock_verify_jwt, mock_db):
    mock_verify_jwt.return_value = {"user_id": "user_101"}
    mock_get_hash.return_value = "hashed_old_password"
    mock_verify_pw.return_value = True # Simulate correct current password
    mock_hash.return_value = "hashed_new_password"

    payload = {
        "currentPassword": "old_password_123",
        "newPassword": "new_password_456",
        "confirmPassword": "new_password_456"
    }

    response = client.put("/api/password", json=payload, headers={"Authorization": "Bearer valid_token"})
    
    assert response.status_code == 200
    assert response.json()["success"] is True
    
    # Verify the save logic was called to update the DB
    mock_save_auth.assert_called_once_with("user_101", "", "hashed_new_password")

# INT-P04: Verify password update fails with incorrect current password.
@patch("routes.user_routes.verify_jwt_token")
@patch("services.user_service.get_user_auth_hash")
@patch("services.user_service.verify_password")
def test_int_p04_update_password_wrong_current(mock_verify_pw, mock_get_hash, mock_verify_jwt):
    mock_verify_jwt.return_value = {"user_id": "user_101"}
    mock_get_hash.return_value = "hashed_old_password"
    mock_verify_pw.return_value = False # Simulate WRONG current password

    payload = {
        "currentPassword": "wrong_password",
        "newPassword": "new_password_456",
        "confirmPassword": "new_password_456"
    }

    response = client.put("/api/password", json=payload, headers={"Authorization": "Bearer valid_token"})
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Current password incorrect"

# INT-P05: Verify account deletion removes userData, userAuth, and revokes sessions.
@patch("routes.user_routes.verify_jwt_token")
@patch("services.user_service.db")
def test_int_p05_delete_account_cascade(mock_db_service, mock_verify_jwt, mock_db):
    mock_db_service.collection.side_effect = mock_db.collection
    mock_verify_jwt.return_value = {"user_id": "user_101"}

    response = client.delete("/api/profile", headers={"Authorization": "Bearer valid_token"})
    
    assert response.status_code == 200
    assert response.json()["success"] is True

    # 1. Verify userData is gone
    assert "user_101" not in mock_db.data[USERDATA_COLLECTION]
    
    # 2. Verify userAuth is gone
    assert "user_101" not in mock_db.data[USERAUTH_COLLECTION]
    
    # 3. Verify active sessions were revoked
    assert mock_db.data[SESSIONS_COLLECTION]["session_xyz"]["revoked"] is True

# INT-P06: Verify retrieving staff directory filters by role=='staff'.
@patch("services.user_service.db")
def test_int_p06_get_all_staff_role_filter(mock_db_service, mock_db):
    mock_db_service.collection.side_effect = mock_db.collection

    response = client.get("/api/staff")
    
    assert response.status_code == 200
    staff_list = response.json()
    
    # We seeded 1 staff (user_101) and 1 manager (user_102)
    assert len(staff_list) == 1
    assert staff_list[0]["id"] == "user_101"
    assert staff_list[0]["role"] == "staff"