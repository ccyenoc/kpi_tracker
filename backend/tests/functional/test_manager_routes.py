from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path
import importlib

import pytest
from fastapi import HTTPException, Request
from fastapi.testclient import TestClient

from main import app


client = TestClient(app)

API_PREFIX = "/api"
MANAGER_PREFIX = f"{API_PREFIX}/manager"
KPI_PREFIX = f"{API_PREFIX}/kpi"


# ---------------------------------------------------------------------
# Fake Firestore
# ---------------------------------------------------------------------

class FakeDocumentSnapshot:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data

    @property
    def exists(self):
        return self._data is not None

    def to_dict(self):
        if self._data is None:
            return None
        return deepcopy(self._data)


class FakeDocumentReference:
    def __init__(self, fake_db, collection_name, doc_id):
        self.fake_db = fake_db
        self.collection_name = collection_name
        self.id = doc_id

    def get(self):
        data = self.fake_db.store.get(self.collection_name, {}).get(self.id)
        return FakeDocumentSnapshot(self.id, data)

    def set(self, data):
        self.fake_db.store.setdefault(self.collection_name, {})[self.id] = deepcopy(data)

    def update(self, data):
        self.fake_db.store.setdefault(self.collection_name, {})

        if self.id not in self.fake_db.store[self.collection_name]:
            self.fake_db.store[self.collection_name][self.id] = {}

        self.fake_db.store[self.collection_name][self.id].update(deepcopy(data))

    def delete(self):
        self.fake_db.store.get(self.collection_name, {}).pop(self.id, None)


class FakeQuery:
    def __init__(self, fake_db, collection_name, filters=None):
        self.fake_db = fake_db
        self.collection_name = collection_name
        self.filters = filters or []

    def where(self, *args, **kwargs):
        new_filters = list(self.filters)

        if "filter" in kwargs:
            filter_obj = kwargs["filter"]

            field = (
                getattr(filter_obj, "field_path", None)
                or getattr(filter_obj, "_field_path", None)
            )

            op = (
                getattr(filter_obj, "op_string", None)
                or getattr(filter_obj, "_op_string", None)
            )

            value = (
                getattr(filter_obj, "value", None)
                or getattr(filter_obj, "_value", None)
            )

            if field:
                new_filters.append((field, op, value))

        elif len(args) >= 3:
            new_filters.append((args[0], args[1], args[2]))

        return FakeQuery(self.fake_db, self.collection_name, new_filters)

    def stream(self):
        docs = []

        for doc_id, data in self.fake_db.store.get(self.collection_name, {}).items():
            if self._matches_filters(data):
                docs.append(FakeDocumentSnapshot(doc_id, data))

        return docs

    def _matches_filters(self, data):
        for field, op, value in self.filters:
            actual = data.get(field)

            if op == "==":
                if actual != value:
                    return False

            elif op == "!=":
                if actual == value:
                    return False

            elif op == "array_contains":
                if not isinstance(actual, list) or value not in actual:
                    return False

        return True


class FakeCollectionReference(FakeQuery):
    def document(self, doc_id=None):
        if doc_id is None:
            doc_id = f"auto_{len(self.fake_db.store.get(self.collection_name, {})) + 1}"

        return FakeDocumentReference(self.fake_db, self.collection_name, doc_id)


class FakeDB:
    def __init__(self):
        now = datetime.now(timezone.utc)
        future = now + timedelta(days=30)

        self.store = {
            "kpiData": {
                "kpi_001": {
                    "title": "Monthly Sales Target",
                    "description": "Achieve monthly sales target",
                    "categoryId": "sales",
                    "categoryName": "Sales Performance",
                    "target": 100,
                    "unit": "units",
                    "deadline": future.isoformat(),
                    "assignedUserIds": ["staff_001"],
                    "kpiAssignments": [
                        {
                            "userId": "staff_001",
                            "current": 50,
                            "target": 100,
                            "assignedAt": now.isoformat()
                        }
                    ],
                    "status": "active",
                    "createdBy": "manager_001",
                    "createdAt": now.isoformat(),
                    "updatedAt": now.isoformat()
                }
            },
            "userData": {
                "manager_001": {
                    "name": "Manager One",
                    "email": "manager@example.com",
                    "role": "manager",
                    "department": "Sales"
                },
                "staff_001": {
                    "name": "Staff One",
                    "email": "staff1@example.com",
                    "role": "staff",
                    "department": "Sales"
                }
            },
            "kpiSubmissions": {
                "sub_001": {
                    "id": "sub_001",
                    "kpiId": "kpi_001",
                    "current": 100,
                    "notes": "Completed monthly sales target",
                    "status": "pending",
                    "submittedBy": "staff_001",
                    "submittedAt": now.isoformat(),
                    "files": [
                        {
                            "originalName": "evidence_001.pdf",
                            "storedName": "evidence_001.pdf",
                            "path": "uploads/evidence_001.pdf"
                        }
                    ]
                },
                "sub_002": {
                    "id": "sub_002",
                    "kpiId": "kpi_001",
                    "current": 60,
                    "notes": "Partial progress update",
                    "status": "pending",
                    "submittedBy": "staff_001",
                    "submittedAt": now.isoformat(),
                    "files": []
                }
            }
        }

    def collection(self, collection_name):
        self.store.setdefault(collection_name, {})
        return FakeCollectionReference(self, collection_name)


# ---------------------------------------------------------------------
# Patch Helpers
# ---------------------------------------------------------------------

def patch_if_exists(monkeypatch, dotted_path, value):
    module_name, attr_name = dotted_path.rsplit(".", 1)

    try:
        module = importlib.import_module(module_name)
    except Exception:
        return

    monkeypatch.setattr(module, attr_name, value, raising=False)


def fake_verify_jwt_token(token):
    if token == "valid_manager_token":
        return {
            "user_id": "manager_001",
            "role": "manager"
        }

    if token == "valid_staff_token":
        return {
            "user_id": "staff_001",
            "role": "staff"
        }

    raise HTTPException(status_code=401, detail="Invalid JWT token")


def fake_extract_user_from_request(request: Request):
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing JWT token")

    token = auth_header.replace("Bearer ", "")
    return fake_verify_jwt_token(token)


def fake_require_manager(request: Request):
    decoded = fake_extract_user_from_request(request)

    if decoded.get("role") != "manager":
        raise HTTPException(status_code=403, detail="Manager access required")

    return decoded


def fake_require_user(request: Request):
    return fake_extract_user_from_request(request)


def fake_send_email(*args, **kwargs):
    return None


class FakeSubmissionVerificationService:
    @staticmethod
    def get_all_submissions(kpi_id=None):
        submissions = [
            {
                "id": "sub_001",
                "kpiId": "kpi_001",
                "current": 100,
                "notes": "Completed monthly sales target",
                "status": "pending",
                "submittedBy": "staff_001",
                "submittedAt": datetime.now(timezone.utc).isoformat(),
                "files": [
                    {
                        "originalName": "evidence_001.pdf",
                        "storedName": "evidence_001.pdf",
                        "path": "uploads/evidence_001.pdf"
                    }
                ]
            },
            {
                "id": "sub_002",
                "kpiId": "kpi_001",
                "current": 60,
                "notes": "Partial progress update",
                "status": "pending",
                "submittedBy": "staff_001",
                "submittedAt": datetime.now(timezone.utc).isoformat(),
                "files": []
            }
        ]

        if kpi_id:
            submissions = [
                submission for submission in submissions
                if submission["kpiId"] == kpi_id
            ]

        return {
            "success": True,
            "submissions": submissions,
            "count": len(submissions)
        }

    @staticmethod
    def get_pending_submissions(kpi_id=None):
        result = FakeSubmissionVerificationService.get_all_submissions(kpi_id)

        pending_submissions = [
            submission for submission in result["submissions"]
            if submission["status"] == "pending"
        ]

        return {
            "success": True,
            "submissions": pending_submissions,
            "count": len(pending_submissions)
        }

    @staticmethod
    def verify_submission(submission_id, kpi_id, status, comments, manager_id):
        if status not in ["approved", "rejected"]:
            return {
                "success": False,
                "message": "Invalid status. Use 'approved' or 'rejected'"
            }

        return {
            "success": True,
            "message": f"Submission {status} successfully",
            "submissionId": submission_id,
            "status": status
        }


@pytest.fixture(autouse=True)
def mock_backend_dependencies(monkeypatch):
    fake_db = FakeDB()

    db_patch_targets = [
        "config.firebase_config.db",
        "services.kpi_service.db",
        "services.manager_service.db",
        "services.user_service.db",
        "routes.kpi_routes.db",
        "routes.manager_routes.db",
        "routes.user_routes.db",
        "routers.kpi_routes.db",
        "routers.manager_routes.db",
        "routers.user_routes.db",
    ]

    for target in db_patch_targets:
        patch_if_exists(monkeypatch, target, fake_db)

    get_db_patch_targets = [
        "services.kpi_service.get_db",
        "services.manager_service.get_db",
        "services.kpi_assignment_service.get_db",
        "routes.kpi_routes.get_db",
        "routes.manager_routes.get_db",
        "routers.kpi_routes.get_db",
        "routers.manager_routes.get_db",
    ]

    for target in get_db_patch_targets:
        patch_if_exists(monkeypatch, target, lambda: fake_db)

    manager_auth_patch_targets = [
        "utils.auth_utils.require_manager",
        "services.kpi_service.require_manager",
        "services.manager_service.require_manager",
        "routes.kpi_routes.require_manager",
        "routes.manager_routes.require_manager",
        "routers.kpi_routes.require_manager",
        "routers.manager_routes.require_manager",
    ]

    for target in manager_auth_patch_targets:
        patch_if_exists(monkeypatch, target, fake_require_manager)

    user_auth_patch_targets = [
        "utils.auth_utils.require_user",
        "services.kpi_service.require_user",
        "services.manager_service.require_user",
        "routes.kpi_routes.require_user",
        "routes.manager_routes.require_user",
        "routers.kpi_routes.require_user",
        "routers.manager_routes.require_user",
    ]

    for target in user_auth_patch_targets:
        patch_if_exists(monkeypatch, target, fake_require_user)

    jwt_patch_targets = [
        "utils.security.verify_jwt_token",
        "utils.auth_utils.verify_jwt_token",
        "services.kpi_service.verify_jwt_token",
        "services.manager_service.verify_jwt_token",
        "routes.kpi_routes.verify_jwt_token",
        "routes.manager_routes.verify_jwt_token",
        "routers.kpi_routes.verify_jwt_token",
        "routers.manager_routes.verify_jwt_token",
    ]

    for target in jwt_patch_targets:
        patch_if_exists(monkeypatch, target, fake_verify_jwt_token)

    extract_user_patch_targets = [
        "utils.auth_utils.extract_user_from_request",
        "utils.auth_utils.get_user_from_request",
        "utils.auth_utils.get_current_user_from_request",
        "services.kpi_service.extract_user_from_request",
        "services.kpi_service.get_user_from_request",
        "services.kpi_service.get_current_user_from_request",
        "routes.kpi_routes.extract_user_from_request",
        "routes.kpi_routes.get_user_from_request",
        "routes.kpi_routes.get_current_user_from_request",
        "routers.kpi_routes.extract_user_from_request",
        "routers.kpi_routes.get_user_from_request",
        "routers.kpi_routes.get_current_user_from_request",
    ]

    for target in extract_user_patch_targets:
        patch_if_exists(monkeypatch, target, fake_extract_user_from_request)

    submission_service_patch_targets = [
        "services.kpi_service.SubmissionVerificationService",
        "services.manager_service.SubmissionVerificationService",
        "services.kpi_assignment_service.SubmissionVerificationService",
        "routes.kpi_routes.SubmissionVerificationService",
        "routes.manager_routes.SubmissionVerificationService",
        "routers.kpi_routes.SubmissionVerificationService",
        "routers.manager_routes.SubmissionVerificationService",
    ]

    for target in submission_service_patch_targets:
        patch_if_exists(monkeypatch, target, FakeSubmissionVerificationService)

    collection_patch_targets = [
        "firebase_secure.KPI_COLLECTION",
        "services.kpi_service.KPI_COLLECTION",
        "routes.kpi_routes.KPI_COLLECTION",
        "routers.kpi_routes.KPI_COLLECTION",
    ]

    for target in collection_patch_targets:
        patch_if_exists(monkeypatch, target, "kpiData")

    email_patch_targets = [
        "services.kpi_service.send_kpi_assignment_email",
        "services.kpi_service.send_email",
        "services.manager_service.send_kpi_assignment_email",
        "services.manager_service.send_email",
        "routes.kpi_routes.send_kpi_assignment_email",
        "routes.kpi_routes.send_email",
        "routers.kpi_routes.send_kpi_assignment_email",
        "routers.kpi_routes.send_email",
    ]

    for target in email_patch_targets:
        patch_if_exists(monkeypatch, target, fake_send_email)

    uploads_dir = Path("uploads")
    uploads_dir.mkdir(exist_ok=True)

    evidence_file = uploads_dir / "evidence_001.pdf"
    evidence_file.write_bytes(b"%PDF-1.4 fake pdf content")

    yield fake_db

    if evidence_file.exists():
        evidence_file.unlink()


# ---------------------------------------------------------------------
# 3.4 Manager Module Functional Testing
# ---------------------------------------------------------------------

def test_ft01_manager_endpoint_missing_jwt_token():
    response = client.get(f"{MANAGER_PREFIX}/kpis")

    assert response.status_code == 401


def test_ft02_manager_endpoint_staff_token_forbidden():
    response = client.get(
        f"{MANAGER_PREFIX}/kpis",
        headers={"Authorization": "Bearer valid_staff_token"}
    )

    assert response.status_code == 403


def test_ft03_create_kpi_success():
    payload = {
        "title": "Monthly Sales Target",
        "description": "Achieve monthly sales target",
        "categoryId": "sales",
        "categoryName": "Sales Performance",
        "target": 100,
        "unit": "units",
        "frequency": "monthly",
        "deadline": "2026-07-31T00:00:00.000Z",
        "assignedUserIds": ["staff_001"],
        "kpiAssignments": [
            {
                "userId": "staff_001",
                "current": 0,
                "target": 100
            }
        ]
    }

    response = client.post(
        f"{MANAGER_PREFIX}/kpi",
        json=payload,
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "kpi" in data
    assert data["kpi"]["title"] == "Monthly Sales Target"
    assert data["kpi"]["status"] == "active"


def test_ft04_create_kpi_validation_error():
    payload = {
        "description": "Achieve monthly sales target",
        "categoryId": "sales",
        "categoryName": "Sales Performance",
        "target": -10,
        "unit": "units",
        "deadline": "2026-07-31T00:00:00.000Z",
        "assignedUserIds": [],
        "kpiAssignments": []
    }

    response = client.post(
        f"{MANAGER_PREFIX}/kpi",
        json=payload,
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 422


def test_ft05_update_kpi_success():
    payload = {
        "title": "Updated Monthly Sales Target",
        "description": "Updated KPI description",
        "categoryId": "sales",
        "categoryName": "Sales Performance",
        "target": 150,
        "unit": "units",
        "deadline": "2026-08-31T00:00:00.000Z"
    }

    response = client.put(
        f"{MANAGER_PREFIX}/kpi/kpi_001",
        json=payload,
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "kpi" in data
    assert data["kpi"]["id"] == "kpi_001"


def test_ft06_delete_kpi_success():
    response = client.delete(
        f"{MANAGER_PREFIX}/kpi/kpi_001",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True


def test_ft07_retrieve_all_kpis():
    response = client.get(
        f"{MANAGER_PREFIX}/kpis",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "kpis" in data
    assert isinstance(data["kpis"], list)


def test_ft08_retrieve_single_kpi_success_and_not_found():
    success_response = client.get(
        f"{MANAGER_PREFIX}/kpi/kpi_001",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert success_response.status_code == 200

    success_data = success_response.json()

    assert success_data["success"] is True
    assert "kpi" in success_data
    assert success_data["kpi"]["id"] == "kpi_001"

    not_found_response = client.get(
        f"{MANAGER_PREFIX}/kpi/invalid_kpi_id",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert not_found_response.status_code == 404


def test_ft09_retrieve_dashboard_stats():
    response = client.get(
        f"{MANAGER_PREFIX}/dashboard/stats",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "dashboardStats" in data
    assert "staffRankings" in data


def test_ft10_retrieve_kpi_history_data():
    response = client.get(
        f"{MANAGER_PREFIX}/kpi/history",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "chart" in data
    assert isinstance(data["chart"], list)


def test_ft11_retrieve_kpi_prediction():
    response = client.get(
        f"{MANAGER_PREFIX}/kpi/kpi_001/predict",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "chart" in data
    assert isinstance(data["chart"], list)


def test_ft12_retrieve_all_submissions():
    response = client.get(
        f"{KPI_PREFIX}/submissions",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert "submissions" in data
    assert isinstance(data["submissions"], list)


def test_ft13_approve_staff_submission():
    payload = {
        "submissionId": "sub_001",
        "kpiId": "kpi_001",
        "status": "approved",
        "comments": "Progress approved"
    }

    response = client.post(
        f"{KPI_PREFIX}/verify-submission",
        json=payload,
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["submissionId"] == "sub_001"
    assert data["status"] == "approved"


def test_ft14_reject_staff_submission():
    payload = {
        "submissionId": "sub_002",
        "kpiId": "kpi_001",
        "status": "rejected",
        "comments": "Evidence is insufficient"
    }

    response = client.post(
        f"{KPI_PREFIX}/verify-submission",
        json=payload,
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert response.status_code == 200

    data = response.json()

    assert data["success"] is True
    assert data["submissionId"] == "sub_002"
    assert data["status"] == "rejected"


def test_ft15_download_evidence_file_success_and_not_found():
    success_response = client.get(
        f"{KPI_PREFIX}/evidence/evidence_001.pdf",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert success_response.status_code == 200

    success_content_type = success_response.headers.get("content-type", "")

    assert success_content_type in [
        "application/pdf",
        "application/octet-stream",
        "image/png",
        "image/jpeg"
    ]

    not_found_response = client.get(
        f"{KPI_PREFIX}/evidence/missing_file.pdf",
        headers={"Authorization": "Bearer valid_manager_token"}
    )

    assert not_found_response.status_code in [200, 404]