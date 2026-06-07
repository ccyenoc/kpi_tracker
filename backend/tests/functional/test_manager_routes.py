import pytest
from unittest.mock import patch, MagicMock

# Helper to mock require_manager role check
def mock_manager_role(db_mock, role="manager", exists=True):
    mock_user_doc = MagicMock()
    mock_user_doc.exists = exists
    mock_user_doc.to_dict.return_value = {"role": role, "name": "Jane Manager", "email": "manager@company.com"}
    
    # We will return the custom document specifically for userData collection
    def collection_router(name):
        col = MagicMock()
        if name == "userData":
            col.document.return_value.get.return_value = mock_user_doc
        else:
            col.document.return_value = MagicMock()
        col.where.return_value = col
        col.stream.return_value = []
        return col

    db_mock.collection.side_effect = collection_router

# FT-01: Manager Endpoint Access Denied - Missing Token
def test_manager_kpis_denied_missing_token(client, jwt_mock):
    # Set jwt mock to raise 401
    jwt_mock.side_effect = Exception("Missing token")
    response = client.get("/api/manager/kpis")
    assert response.status_code == 401

# FT-02: Manager Endpoint Access Denied - Staff Token
def test_manager_kpis_denied_staff_token(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "staff_01"}
    mock_manager_role(db_mock, role="staff")
    
    response = client.get("/api/manager/kpis", headers={"Authorization": "Bearer staff_token"})
    assert response.status_code == 403

# FT-03: Create KPI - POST /api/manager/kpi
@patch("services.kpi_service.send_kpi_assignment_email")
def test_create_kpi_success(mock_send_email, client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_manager_role(db_mock, role="manager")
    
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "kpi_999"
    
    # Route collections: manager checks userData, create_kpi sets kpiData
    def collection_router(name):
        col = MagicMock()
        if name == "userData":
            mock_user_doc = MagicMock()
            mock_user_doc.exists = True
            mock_user_doc.to_dict.return_value = {"role": "manager", "name": "Jane Manager", "email": "manager@company.com"}
            col.document.return_value.get.return_value = mock_user_doc
        elif name == "kpiData":
            col.document.return_value = mock_doc_ref
        return col

    db_mock.collection.side_effect = collection_router
    
    payload = {
        "title": "Monthly Sales Target",
        "description": "Achieve monthly sales target",
        "categoryId": "sales",
        "categoryName": "Sales Performance",
        "target": 100.0,
        "unit": "units",
        "frequency": "monthly",
        "deadline": "2026-07-31T00:00:00.000Z",
        "assignedUserIds": [],
        "kpiAssignments": []
    }
    
    response = client.post(
        "/api/manager/kpi",
        json=payload,
        headers={"Authorization": "Bearer valid_manager_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["kpi"]["title"] == "Monthly Sales Target"

# FT-04: Create KPI Validation Error
def test_create_kpi_validation_error(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_manager_role(db_mock, role="manager")
    
    # Payload is missing required field `title` and target is invalid negative value
    payload = {
        "description": "Missing title",
        "target": -10
    }
    response = client.post(
        "/api/manager/kpi",
        json=payload,
        headers={"Authorization": "Bearer valid_manager_token"}
    )
    assert response.status_code == 422

# FT-05: Update KPI - PUT /api/manager/kpi/{kpi_id}
def test_update_kpi_success(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_manager_role(db_mock, role="manager")
    
    mock_doc_ref = MagicMock()
    mock_doc_snapshot = MagicMock()
    mock_doc_snapshot.exists = True
    mock_doc_snapshot.to_dict.return_value = {
        "title": "Updated Monthly Sales Target",
        "target": 150.0
    }
    mock_doc_ref.get.return_value = mock_doc_snapshot
    
    def collection_router(name):
        col = MagicMock()
        if name == "userData":
            mock_user_doc = MagicMock()
            mock_user_doc.exists = True
            mock_user_doc.to_dict.return_value = {"role": "manager"}
            col.document.return_value.get.return_value = mock_user_doc
        elif name == "kpiData":
            col.document.return_value = mock_doc_ref
        return col

    db_mock.collection.side_effect = collection_router
    
    payload = {
        "title": "Updated Monthly Sales Target",
        "target": 150.0
    }
    response = client.put(
        "/api/manager/kpi/kpi_001",
        json=payload,
        headers={"Authorization": "Bearer valid_manager_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["kpi"]["title"] == "Updated Monthly Sales Target"

# FT-06: Delete KPI - DELETE /api/manager/kpi/{kpi_id}
def test_delete_kpi_success(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_manager_role(db_mock, role="manager")
    
    mock_doc_ref = MagicMock()
    mock_doc_snapshot = MagicMock()
    mock_doc_snapshot.exists = True
    mock_doc_ref.get.return_value = mock_doc_snapshot
    
    def collection_router(name):
        col = MagicMock()
        if name == "userData":
            mock_user_doc = MagicMock()
            mock_user_doc.exists = True
            mock_user_doc.to_dict.return_value = {"role": "manager"}
            col.document.return_value.get.return_value = mock_user_doc
        elif name == "kpiData":
            col.document.return_value = mock_doc_ref
        return col

    db_mock.collection.side_effect = collection_router
    
    response = client.delete(
        "/api/manager/kpi/kpi_001",
        headers={"Authorization": "Bearer valid_manager_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

# FT-07: Retrieve All KPIs - GET /api/manager/kpis
def test_retrieve_all_kpis_success(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_manager_role(db_mock, role="manager")
    
    mock_doc = MagicMock()
    mock_doc.id = "kpi_001"
    mock_doc.to_dict.return_value = {"title": "Monthly Sales Target"}
    
    def collection_router(name):
        col = MagicMock()
        if name == "userData":
            mock_user_doc = MagicMock()
            mock_user_doc.exists = True
            mock_user_doc.to_dict.return_value = {"role": "manager"}
            col.document.return_value.get.return_value = mock_user_doc
        elif name == "kpiData":
            col.stream.return_value = [mock_doc]
        return col

    db_mock.collection.side_effect = collection_router
    
    response = client.get(
        "/api/manager/kpis",
        headers={"Authorization": "Bearer valid_manager_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["kpis"]) == 1

# FT-08: Retrieve Single KPI - GET /api/manager/kpi/{kpi_id}
def test_retrieve_single_kpi_success(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_manager_role(db_mock, role="manager")
    
    mock_doc_snapshot = MagicMock()
    mock_doc_snapshot.exists = True
    mock_doc_snapshot.to_dict.return_value = {"title": "Target KPI"}
    
    def collection_router(name):
        col = MagicMock()
        if name == "userData":
            mock_user_doc = MagicMock()
            mock_user_doc.exists = True
            mock_user_doc.to_dict.return_value = {"role": "manager"}
            col.document.return_value.get.return_value = mock_user_doc
        elif name == "kpiData":
            col.document.return_value.get.return_value = mock_doc_snapshot
        return col

    db_mock.collection.side_effect = collection_router
    
    response = client.get(
        "/api/manager/kpi/kpi_001",
        headers={"Authorization": "Bearer valid_manager_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["kpi"]["title"] == "Target KPI"

# FT-09: Retrieve Dashboard Stats - GET /api/manager/dashboard/stats
@patch("routes.kpi_routes.ManagerDashboardService.get_dashboard_stats")
def test_retrieve_dashboard_stats_success(mock_get_stats, client):
    # Short circuit stats calculations to test route response mapping
    mock_get_stats.return_value = {
        "success": True,
        "dashboardStats": {"totalKPIs": 2, "activeKPIs": 1, "completedKPIs": 1, "totalStaff": 2},
        "staffRankings": []
    }
    
    response = client.get(
        "/api/manager/dashboard/stats",
        headers={"Authorization": "Bearer valid_manager_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["dashboardStats"]["totalKPIs"] == 2

# FT-12: Retrieve All Submissions - GET /api/kpi/submissions
@patch("routes.kpi_routes.SubmissionVerificationService.get_all_submissions")
def test_retrieve_all_submissions_success(mock_get_submissions, client):
    mock_get_submissions.return_value = {
        "success": True,
        "submissions": [],
        "count": 0
    }
    response = client.get(
        "/api/kpi/submissions",
        headers={"Authorization": "Bearer valid_manager_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["submissions"] == []

# FT-13: Approve Staff Submission - POST /api/kpi/verify-submission
@patch("routes.kpi_routes.SubmissionVerificationService.verify_submission")
def test_verify_submission_approve_success(mock_verify, client, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123"}
    mock_verify.return_value = {
        "success": True,
        "submissionId": "sub_001",
        "status": "approved"
    }
    
    payload = {
        "submissionId": "sub_001",
        "kpiId": "kpi_001",
        "status": "approved",
        "comments": "Progress approved"
    }
    
    response = client.post(
        "/api/kpi/verify-submission",
        json=payload,
        headers={"Authorization": "Bearer valid_manager_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "approved"

# FT-15: Download Evidence File - GET /api/kpi/evidence/{file_name}
def test_download_evidence_file_not_found(client):
    # Access a non-existent file path
    response = client.get("/api/kpi/evidence/missing_file.pdf")
    # Our backend checks existence and returns a JSON response instead of FileResponse
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert data["message"] == "File not found"
