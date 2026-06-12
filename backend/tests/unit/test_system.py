import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from fastapi import Request

# UT-31: Prediction Engine Tests - Success
def test_predict_kpi_service_success():
    mock_kpi = {
        "kpi": {
            "title": "Sales Target",
            "kpiAssignments": [
                {"userId": "staff_101", "current": 40.0, "target": 100.0}
            ]
        }
    }
    
    with patch("services.predictionService.get_kpi", return_value=mock_kpi):
        from services.predictionService import predict_kpi
        result = predict_kpi("kpi_123", MagicMock(spec=Request))
        
        assert result["success"] is True
        chart = result["chart"]
        assert len(chart) == 4
        
        assert chart[0]["time"] == "Week 1"
        assert chart[0]["kpi"] == 25
        assert chart[0]["progress"] == 10.0
        assert chart[0]["prediction"] == 11.0
        
        assert chart[3]["time"] == "Week 4"
        assert chart[3]["kpi"] == 100
        assert chart[3]["progress"] == 40.0
        assert chart[3]["prediction"] == 44.0

# UT-32: Prediction Engine Tests - Empty Assignment
def test_predict_kpi_service_empty_assignments():
    mock_kpi = {
        "kpi": {
            "title": "Sales Target",
            "kpiAssignments": []
        }
    }
    
    with patch("services.predictionService.get_kpi", return_value=mock_kpi):
        from services.predictionService import predict_kpi
        result = predict_kpi("kpi_123", MagicMock(spec=Request))
        
        assert result["success"] is True
        assert result["chart"] == []


# UT-33: Notification System Tests
@patch("services.kpi_service.smtplib.SMTP")
def test_send_kpi_assignment_email_smtp_call(mock_smtp):
    mock_server = MagicMock()
    mock_smtp.return_value.__enter__.return_value = mock_server
    
    with patch("services.kpi_service.SMTP_HOST", "smtp.test.com"), \
         patch("services.kpi_service.SMTP_USER", "test_user"), \
         patch("services.kpi_service.SMTP_PASSWORD", "test_pass"), \
         patch("services.kpi_service.SMTP_FROM", "from@test.com"), \
         patch("services.kpi_service.SMTP_PORT", 587), \
         patch("services.kpi_service.SMTP_USE_TLS", True):
         
        from services.kpi_service import send_kpi_assignment_email
        send_kpi_assignment_email("to@example.com", "John Doe", "KPI-01", "2026-12-31")
        
    mock_smtp.assert_called_once_with("smtp.test.com", 587, timeout=20)
    mock_server.starttls.assert_called_once()
    mock_server.login.assert_called_once_with("test_user", "test_pass")
    mock_server.send_message.assert_called_once()

# UT-34: Send Email
@patch("services.kpi_service.smtplib.SMTP")
def test_send_email_smtp_call(mock_smtp):
    mock_server = MagicMock()
    mock_smtp.return_value.__enter__.return_value = mock_server
    
    with patch("services.kpi_service.SMTP_HOST", "smtp.test.com"), \
         patch("services.kpi_service.SMTP_USER", "test_user"), \
         patch("services.kpi_service.SMTP_PASSWORD", "test_pass"), \
         patch("services.kpi_service.SMTP_FROM", "from@test.com"), \
         patch("services.kpi_service.SMTP_PORT", 587), \
         patch("services.kpi_service.SMTP_USE_TLS", False):
         
        from services.kpi_service import send_email
        send_email("manager@example.com", "Submission Notification", 
        "Submission details here")
        
    mock_smtp.assert_called_once_with("smtp.test.com", 587, timeout=20)
    mock_server.starttls.assert_not_called()
    mock_server.login.assert_called_once_with("test_user", "test_pass")
    mock_server.send_message.assert_called_once()


# UT-35: Get Weekly KPI Calculations
@patch("services.kpi_service.db")
def test_get_weekly_kpi_calculations(mock_db):
    mock_doc1 = MagicMock()
    mock_doc1.id = "kpi_active_1"
    mock_doc1.to_dict.return_value = {
        "title": "Weekly KPI A",
        "description": "Weekly KPI A Description",
        "status": "active",
        "kpiAssignments": [
            {"userId": "staff_1", "current": 20, "target": 100},
            {"userId": "staff_2", "current": 40, "target": 80}
        ]
    }
    
    mock_collection = MagicMock()
    mock_collection.where.return_value = mock_collection
    mock_collection.stream.return_value = [mock_doc1]
    mock_db.collection.return_value = mock_collection
    
    from services.kpi_service import get_weekly_kpi
    result = get_weekly_kpi()
    
    assert result["success"] is True
    assert result["summary"]["totalActiveKpis"] == 1
    assert result["summary"]["totalAssignments"] == 2
    assert result["summary"]["averageProgress"] == 35.0
    assert result["kpis"][0]["progress"] == 35.0
    assert result["kpis"][0]["kpiAssignments"][0]["progress"] == 20.0
    assert result["kpis"][0]["kpiAssignments"][1]["progress"] == 50.0

# UT-36: Get Monthly KPI Calculations
@patch("services.kpi_service.db")
def test_get_monthly_kpi_calculations(mock_db):
    mock_doc_completed = MagicMock()
    mock_doc_completed.id = "kpi_comp"
    mock_doc_completed.to_dict.return_value = {
        "title": "Completed KPI",
        "status": "completed",
        "kpiAssignments": [
            {"userId": "staff_1", "current": 10, "target": 10}
        ]
    }
    
    mock_doc_active = MagicMock()
    mock_doc_active.id = "kpi_act"
    mock_doc_active.to_dict.return_value = {
        "title": "Active KPI",
        "status": "active",
        "kpiAssignments": [
            {"userId": "staff_1", "current": 10, "target": 50}
        ]
    }
    
    mock_collection = MagicMock()
    mock_collection.stream.return_value = [mock_doc_completed, mock_doc_active]
    mock_db.collection.return_value = mock_collection
    
    from services.kpi_service import get_monthly_kpi
    result = get_monthly_kpi()
    
    assert result["success"] is True
    assert result["summary"]["totalKpis"] == 2
    assert result["summary"]["completedKpis"] == 1
    assert result["summary"]["activeKpis"] == 1
    assert result["summary"]["averageProgress"] == 60.0
    assert len(result["completed"]) == 1
    assert len(result["active"]) == 1
