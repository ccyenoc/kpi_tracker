import pytest
from unittest.mock import patch, MagicMock

# FT-01: Get Assigned KPIs - GET /api/staff/kpis
def test_get_staff_kpis_success(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "staff_01", "email": "staff@company.com"}
    
    mock_doc = MagicMock()
    mock_doc.id = "kpi_001"
    mock_doc.to_dict.return_value = {
        "title": "Q3 Sales Target",
        "status": "active",
        "kpiAssignments": [
            {"userId": "staff_01", "target": 100.0, "current": 50.0}
        ]
    }
    
    def col_router(name):
        col = MagicMock()
        col.stream.return_value = [mock_doc]
        return col
    db_mock.collection.side_effect = col_router
    
    response = client.get("/api/staff/kpis", headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["kpis"]) == 1
    assert data["kpis"][0]["id"] == "kpi_001"

# FT-02: Search KPI - GET /api/staff/kpis?search=sales
def test_search_staff_kpis_success(client, db_mock, jwt_mock):
    jwt_mock.return_value = {"user_id": "staff_01", "email": "staff@company.com"}
    
    mock_doc = MagicMock()
    mock_doc.id = "kpi_001"
    mock_doc.to_dict.return_value = {
        "title": "Sales target",
        "status": "active",
        "kpiAssignments": [
            {"userId": "staff_01", "target": 100.0, "current": 50.0}
        ]
    }
    
    def col_router(name):
        col = MagicMock()
        col.stream.return_value = [mock_doc]
        return col
    db_mock.collection.side_effect = col_router
    
    response = client.get("/api/staff/kpis?search=sales", headers={"Authorization": "Bearer valid_token"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    for kpi in data["kpis"]:
        assert "sales" in kpi["title"].lower()

# FT-03: Update KPI Progress - POST /api/kpi/update
@patch("services.kpi_service.get_user_info")
@patch("services.kpi_service.get_kpi_by_id")
@patch("services.kpi_service.send_email")
def test_update_kpi_progress_success(
    mock_send_email,
    mock_get_kpi,
    mock_get_user,
    client,
    db_mock,
    jwt_mock
):
    jwt_mock.return_value = {"user_id": "staff_01"}
    mock_get_user.return_value = {"name": "Jane Staff", "email": "jane@company.com"}
    mock_get_kpi.return_value = {
        "title": "Q3 Sales Target",
        "createdBy": "manager_123"
    }
    
    form_data = {
        "kpiId": "kpi_001",
        "current": 75.0,
        "notes": "Completed some additional deals"
    }
    
    response = client.post(
        "/api/kpi/update",
        data=form_data,
        headers={"Authorization": "Bearer valid_token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Submission saved"
    assert data["submission"]["kpiId"] == "kpi_001"
