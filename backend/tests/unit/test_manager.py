import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from pydantic import ValidationError
import datetime as real_datetime

from models.kpi_model import KPICreate, KPIUpdate
from services import kpi_service
from manager_service import ManagerDashboardService, SubmissionVerificationService, KPIPredictionService

# UT-MM-01: Successful KPI Creation
@patch('services.kpi_service.require_manager')
@patch('services.kpi_service.db')
@patch('services.kpi_service.get_user_info')
@patch('services.kpi_service.send_kpi_assignment_email')
def test_create_kpi_success(mock_send_email, mock_get_user, mock_db, mock_require_manager):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_doc_ref = MagicMock()
    mock_doc_ref.id = "kpi_999"
    mock_db.collection.return_value.document.return_value = mock_doc_ref
    
    mock_get_user.return_value = {"name": "Jane Staff", "email": "jane@company.com"}
    mock_request = MagicMock()
    
    kpi_data = KPICreate(
        title="Q3 Sales Target",
        description="Close 150 deals",
        categoryId="cat_01",
        categoryName="Sales",
        target=150.0,
        unit="deals",
        deadline="2026-09-30T00:00:00",
        assignedUserIds=["staff_01"],
        kpiAssignments=[{"userId": "staff_01", "target": 150.0, "current": 0}]
    )
    
    result = kpi_service.create_kpi(kpi_data, mock_request)
    assert result["success"] is True
    assert result["kpi"]["id"] == "kpi_999"
    assert result["kpi"]["title"] == "Q3 Sales Target"
    assert result["kpi"]["status"] == "active"
    mock_doc_ref.set.assert_called_once()
    mock_send_email.assert_called_once_with(
        to_email="jane@company.com",
        staff_name="Jane Staff",
        kpi_title="Q3 Sales Target",
        deadline="2026-09-30T00:00:00"
    )

# UT-MM-02: KPI Creation with Missing or Invalid Data
def test_kpi_creation_missing_required_fields():
    with pytest.raises(ValidationError):
        # target must be a float, title is required but omitted here
        KPICreate(
            description="Missing title and target",
            categoryId="cat_01",
            categoryName="Sales",
            unit="deals",
            deadline="2026-09-30T00:00:00"
        )

# UT-MM-03: Trigger Email Notification on KPI Assignment
@patch('services.kpi_service.smtplib.SMTP')
def test_send_kpi_assignment_email_success(mock_smtp):
    kpi_service.SMTP_HOST = 'smtp.example.com'
    kpi_service.SMTP_USER = 'admin'
    kpi_service.SMTP_PASSWORD = 'password123'
    kpi_service.SMTP_FROM = 'admin@example.com'
    kpi_service.SMTP_USE_TLS = True
    
    mock_server = MagicMock()
    mock_smtp.return_value.__enter__.return_value = mock_server
    
    kpi_service.send_kpi_assignment_email(
        to_email="staff@company.com",
        staff_name="Alex Staff",
        kpi_title="Annual Sales Target",
        deadline="2026-12-31"
    )
    
    mock_smtp.assert_called_once_with('smtp.example.com', 587, timeout=20)
    mock_server.starttls.assert_called_once()
    mock_server.login.assert_called_once_with('admin', 'password123')
    mock_server.send_message.assert_called_once()

# UT-MM-04: Successful Partial KPI Update
@patch('services.kpi_service.require_manager')
@patch('services.kpi_service.db')
def test_update_kpi_success(mock_db, mock_require_manager):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    
    mock_doc_ref = MagicMock()
    mock_doc_snapshot = MagicMock()
    mock_doc_snapshot.exists = True
    mock_doc_snapshot.to_dict.return_value = {"title": "Updated Title", "target": 200.0}
    mock_doc_ref.get.return_value = mock_doc_snapshot
    mock_db.collection.return_value.document.return_value = mock_doc_ref
    
    mock_request = MagicMock()
    kpi_update_data = KPIUpdate(title="Updated Title", target=200.0)
    
    result = kpi_service.update_kpi("kpi_999", kpi_update_data, mock_request)
    assert result["success"] is True
    assert result["kpi"]["title"] == "Updated Title"
    mock_doc_ref.update.assert_called_once()

# UT-MM-05: KPI Update Rejection (Target KPI Not Found)
@patch('services.kpi_service.require_manager')
@patch('services.kpi_service.db')
def test_update_kpi_not_found(mock_db, mock_require_manager):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    
    mock_doc_ref = MagicMock()
    mock_doc_snapshot = MagicMock()
    mock_doc_snapshot.exists = False
    mock_doc_ref.get.return_value = mock_doc_snapshot
    mock_db.collection.return_value.document.return_value = mock_doc_ref
    
    mock_request = MagicMock()
    kpi_update_data = KPIUpdate(title="Updated Title")
    
    with pytest.raises(HTTPException) as exc_info:
        kpi_service.update_kpi("invalid_kpi_999", kpi_update_data, mock_request)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "KPI not found"

# UT-MM-06: Successful KPI Hard Deletion
@patch('services.kpi_service.require_manager')
@patch('services.kpi_service.db')
def test_delete_kpi_success(mock_db, mock_require_manager):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    
    mock_doc_ref = MagicMock()
    mock_doc_snapshot = MagicMock()
    mock_doc_snapshot.exists = True
    mock_doc_ref.get.return_value = mock_doc_snapshot
    mock_db.collection.return_value.document.return_value = mock_doc_ref
    mock_request = MagicMock()
    
    result = kpi_service.delete_kpi("kpi_123", mock_request)
    assert result["success"] is True
    mock_doc_ref.delete.assert_called_once()

# UT-MM-08: Fetch All KPIs with Query Filters
@patch('services.kpi_service.require_manager')
@patch('services.kpi_service.db')
def test_get_kpis_with_filters(mock_db, mock_require_manager):
    mock_require_manager.return_value = {"user_id": "manager_123"}
    mock_request = MagicMock()
    mock_request.query_params.get.side_effect = lambda key: {
        "assignedTo": "staff_01",
        "status": "active"
    }.get(key)
    
    mock_query = MagicMock()
    mock_db.collection.return_value = mock_query
    mock_query.where.return_value = mock_query
    
    mock_doc = MagicMock()
    mock_doc.id = "kpi_777"
    mock_doc.to_dict.return_value = {"title": "Filtered KPI"}
    mock_query.stream.return_value = [mock_doc]
    
    result = kpi_service.get_kpis(mock_request)
    assert result["success"] is True
    assert len(result["kpis"]) == 1
    assert result["kpis"][0]["id"] == "kpi_777"

# UT-MM-10: Dashboard Stats Aggregation Calculation
@patch('manager_service.get_db')
def test_get_dashboard_stats_success(mock_get_db):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    
    mock_kpi_1 = MagicMock()
    mock_kpi_1.to_dict.return_value = {
        "status": "active",
        "kpiAssignments": [
            {"userId": "staff_1", "target": 100.0, "current": 50.0},
            {"userId": "staff_2", "target": 100.0, "current": 100.0}
        ]
    }
    
    mock_kpi_2 = MagicMock()
    mock_kpi_2.to_dict.return_value = {
        "status": "completed",
        "kpiAssignments": [
            {"userId": "staff_1", "target": 100.0, "current": 100.0}
        ]
    }
    
    mock_kpi_stream = MagicMock()
    mock_kpi_stream.stream.return_value = [mock_kpi_1, mock_kpi_2]
    
    def mock_user_get(staff_id):
        mock_user_doc = MagicMock()
        if staff_id == "staff_1":
            mock_user_doc.to_dict.return_value = {"name": "Alice"}
        else:
            mock_user_doc.to_dict.return_value = {"name": "Bob"}
        return mock_user_doc
        
    mock_user_collection = MagicMock()
    mock_user_collection.document.side_effect = lambda doc_id: MagicMock(
        get=lambda: mock_user_get(doc_id)
    )
    
    def collection_router(collection_name):
        if collection_name == "kpiData":
            return mock_kpi_stream
        elif collection_name == "userData":
            return mock_user_collection
            
    mock_db.collection.side_effect = collection_router
    
    result = ManagerDashboardService.get_dashboard_stats()
    assert result["success"] is True
    assert result["dashboardStats"]["totalKPIs"] == 2
    assert result["dashboardStats"]["activeKPIs"] == 1
    assert result["dashboardStats"]["completedKPIs"] == 1

# UT-MM-13: Successful Submission Approval (Updates KPI Progress)
@patch('manager_service.get_db')
def test_verify_submission_approval_success(mock_get_db):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    
    mock_sub_ref = MagicMock()
    mock_sub_doc = MagicMock()
    mock_sub_doc.exists = True
    mock_sub_doc.to_dict.return_value = {
        "submittedBy": "staff_1",
        "current": 100.0,
        "kpiId": "kpi_123"
    }
    mock_sub_ref.get.return_value = mock_sub_doc
    
    mock_kpi_ref = MagicMock()
    mock_kpi_doc = MagicMock()
    mock_kpi_doc.exists = True
    mock_kpi_doc.to_dict.return_value = {
        "kpiAssignments": [
            {"userId": "staff_1", "target": 100.0, "current": 50.0}
        ]
    }
    mock_kpi_ref.get.return_value = mock_kpi_doc
    
    def collection_router(collection_name):
        mock_col = MagicMock()
        if collection_name == "kpiSubmissions":
            mock_col.document.return_value = mock_sub_ref
        elif collection_name == "kpiData":
            mock_col.document.return_value = mock_kpi_ref
        return mock_col
        
    mock_db.collection.side_effect = collection_router
    
    result = SubmissionVerificationService.verify_submission(
        submission_id="sub_999",
        kpi_id="kpi_123",
        status="approved",
        comments="Great work",
        manager_id="manager_1"
    )
    assert result["success"] is True
    assert result["status"] == "approved"
    mock_sub_ref.update.assert_called_once()
    mock_kpi_ref.update.assert_called_once()

# UT-MM-14: Successful Submission Rejection (Maintains Current Progress)
@patch('manager_service.get_db')
def test_verify_submission_rejection_success(mock_get_db):
    mock_db = MagicMock()
    mock_get_db.return_value = mock_db
    
    mock_sub_ref = MagicMock()
    mock_sub_doc = MagicMock()
    mock_sub_doc.exists = True
    mock_sub_doc.to_dict.return_value = {
        "submittedBy": "staff_1",
        "current": 100.0,
        "kpiId": "kpi_123"
    }
    mock_sub_ref.get.return_value = mock_sub_doc
    
    def collection_router(collection_name):
        mock_col = MagicMock()
        if collection_name == "kpiSubmissions":
            mock_col.document.return_value = mock_sub_ref
        return mock_col
        
    mock_db.collection.side_effect = collection_router
    
    result = SubmissionVerificationService.verify_submission(
        submission_id="sub_999",
        kpi_id="kpi_123",
        status="rejected",
        comments="Incomplete evidence",
        manager_id="manager_1"
    )
    assert result["success"] is True
    assert result["status"] == "rejected"
    mock_sub_ref.update.assert_called_once()

# UT-MM-15: Verification Rejection (Invalid Status String)
def test_verify_submission_invalid_status():
    result = SubmissionVerificationService.verify_submission(
        submission_id="sub_999",
        kpi_id="kpi_123",
        status="maybe",
        comments="Not sure",
        manager_id="manager_1"
    )
    assert result["success"] is False
    assert "Invalid status" in result["message"]
