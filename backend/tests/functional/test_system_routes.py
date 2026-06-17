import pytest
from unittest.mock import patch, MagicMock

# FT-31: Weekly Report PDF Endpoint - GET /api/report/weekly
@patch("routes.report_routes.get_weekly_kpi")
def test_get_weekly_report_pdf(mock_get_weekly, client):
    # Setup mock weekly reporter data
    mock_get_weekly.return_value = {
        "summary": {
            "totalActiveKpis": 1,
            "totalAssignments": 2,
            "averageProgress": 35.0
        },
        "kpis": [
            {
                "title": "Sales Target",
                "description": "Increase sales",
                "target": 100,
                "unit": "USD",
                "progress": 35.0,
                "kpiAssignments": [
                    {"userId": "staff_1", "target": 100, "current": 20, "progress": 20.0},
                    {"userId": "staff_2", "target": 100, "current": 50, "progress": 50.0}
                ]
            }
        ]
    }
    
    response = client.get("/api/report/weekly")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "Content-Disposition" in response.headers
    assert response.headers["Content-Disposition"] == "attachment; filename=weekly_report.pdf"
    assert len(response.content) > 0


# FT-32: Monthly Report PDF Endpoint - GET /api/report/monthly
@patch("routes.report_routes.get_monthly_kpi")
def test_get_monthly_report_pdf(mock_get_monthly, client):
    # Setup mock monthly reporter data
    mock_get_monthly.return_value = {
        "summary": {
            "totalKpis": 2,
            "completedKpis": 1,
            "activeKpis": 1,
            "averageProgress": 60.0
        },
        "completed": [
            {
                "title": "Completed KPI A",
                "target": 10,
                "progress": 100.0
            }
        ],
        "active": [
            {
                "title": "Active KPI B",
                "description": "Monthly active",
                "target": 50,
                "unit": "sales",
                "progress": 20.0,
                "kpiAssignments": [
                    {"userId": "staff_1", "target": 50, "current": 10, "progress": 20.0}
                ]
            }
        ]
    }
    
    response = client.get("/api/report/monthly")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "Content-Disposition" in response.headers
    assert response.headers["Content-Disposition"] == "attachment; filename=monthly_report.pdf"
    assert len(response.content) > 0


# FT-33: Staff Monthly Report PDF Endpoint - GET /api/report/monthly/me
@patch("routes.report_routes.db")
def test_get_my_monthly_report_pdf(mock_db, client, jwt_mock):
    # Authenticate as a staff user
    jwt_mock.return_value = {"user_id": "staff_101", "email": "staff@company.com"}
    
    # Mock documents returned from DB stream
    mock_doc1 = MagicMock()
    mock_doc1.id = "kpi_1"
    mock_doc1.to_dict.return_value = {
        "title": "My Completed KPI",
        "description": "Done",
        "status": "completed",
        "unit": "units",
        "kpiAssignments": [
            {"userId": "staff_101", "target": 10, "current": 10}
        ]
    }
    
    mock_doc2 = MagicMock()
    mock_doc2.id = "kpi_2"
    mock_doc2.to_dict.return_value = {
        "title": "My Active KPI",
        "description": "Progressing",
        "status": "active",
        "unit": "units",
        "kpiAssignments": [
            {"userId": "staff_101", "target": 50, "current": 20}
        ]
    }
    
    mock_col = MagicMock()
    mock_col.stream.return_value = [mock_doc1, mock_doc2]
    mock_user_doc = MagicMock()
    mock_user_doc.exists = True
    mock_user_doc.to_dict.return_value = {"name": "Staff"}
    mock_col.document.return_value.get.return_value = mock_user_doc
    mock_db.collection.return_value = mock_col
    
    response = client.get(
        "/api/report/monthly/me",
        headers={"Authorization": "Bearer valid_token"}
    )
    
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "Content-Disposition" in response.headers
    assert "monthly_report_Staff.pdf" in response.headers["Content-Disposition"]
    assert len(response.content) > 0


# FT-34: Prediction Engine Route - GET /api/manager/kpi/{kpi_id}/predict
@patch("routes.kpi_routes.predict_kpi")
def test_predict_kpi_route(mock_predict, client, jwt_mock):
    jwt_mock.return_value = {"user_id": "manager_123", "email": "manager@company.com"}
    mock_predict.return_value = {
        "success": True,
        "chart": [
            {"time": "Week 1", "kpi": 25, "progress": 5.0, "prediction": 5.5},
            {"time": "Week 2", "kpi": 50, "progress": 10.0, "prediction": 11.0},
            {"time": "Week 3", "kpi": 75, "progress": 15.0, "prediction": 16.5},
            {"time": "Week 4", "kpi": 100, "progress": 20.0, "prediction": 22.0}
        ]
    }
    
    response = client.get(
        "/api/manager/kpi/kpi_123/predict",
        headers={"Authorization": "Bearer valid_token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["chart"]) == 4
    assert data["chart"][0]["time"] == "Week 1"
    assert data["chart"][0]["progress"] == 5.0


# FT-35: KPI Assignment Email Notification Trigger - POST /api/manager/kpi
@patch("services.kpi_service.send_kpi_assignment_email")
def test_create_kpi_sends_assignment_email(mock_send_email, client, db_mock, jwt_mock):
    # Authenticate as manager
    jwt_mock.return_value = {"user_id": "manager_123"}
    
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "kpi_999"
    
    # Mock manager checking userData and create_kpi lookup
    def collection_router(name):
        col = MagicMock()
        if name == "userData":
            def doc_side_effect(doc_id):
                doc_ref = MagicMock()
                doc_snap = MagicMock()
                doc_snap.exists = True
                if doc_id == "manager_123":
                    doc_snap.to_dict.return_value = {"role": "manager", "name": "Jane Manager", "email": "manager@company.com"}
                elif doc_id == "staff_101":
                    doc_snap.to_dict.return_value = {"role": "staff", "name": "John Staff", "email": "john@company.com"}
                else:
                    doc_snap.exists = False
                doc_ref.get.return_value = doc_snap
                return doc_ref
            col.document.side_effect = doc_side_effect
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
        "assignedUserIds": ["staff_101"],
        "kpiAssignments": []
    }
    
    response = client.post(
        "/api/manager/kpi",
        json=payload,
        headers={"Authorization": "Bearer valid_token"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    
    # Verify assignment email was triggered
    mock_send_email.assert_called_once_with(
        to_email="john@company.com",
        staff_name="John Staff",
        kpi_title="Monthly Sales Target",
        deadline="2026-07-31T00:00:00.000Z"
    )


# FT-36: KPI Submission Email Trigger - POST /api/kpi/update
@patch("services.kpi_service.get_user_info")
@patch("services.kpi_service.get_kpi_by_id")
@patch("services.kpi_service.send_email")
def test_update_kpi_progress_sends_emails(
    mock_send_email,
    mock_get_kpi,
    mock_get_user,
    client,
    jwt_mock
):
    # Authenticate as staff
    jwt_mock.return_value = {"user_id": "staff_101"}
    
    # Mock user details lookups
    def get_user_info_side_effect(user_id):
        if user_id == "staff_101":
            return {"name": "John Staff", "email": "john@company.com"}
        elif user_id == "manager_123":
            return {"name": "Jane Manager", "email": "manager@company.com"}
        return None
    mock_get_user.side_effect = get_user_info_side_effect
    
    # Mock KPI lookup
    mock_get_kpi.return_value = {
        "title": "Monthly Sales Target",
        "createdBy": "manager_123"
    }
    
    form_data = {
        "kpiId": "kpi_123",
        "current": 75.0,
        "notes": "Finished active steps"
    }
    
    response = client.post(
        "/api/kpi/update",
        data=form_data,
        headers={"Authorization": "Bearer valid_token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert mock_send_email.call_count == 2

