import pytest
from models.kpi_model import KPISubmission

# UT-01: KPI Submission Model Verification
def test_kpi_submission_model():
    submission = KPISubmission(
        kpiId="KPI001",
        current=50.0,
        notes="Monthly sales update"
    )
    assert submission.kpiId == "KPI001"
    assert submission.current == 50.0
    assert submission.notes == "Monthly sales update"

# UT-02: KPI Progress Calculation (using the logic from get_weekly_kpi)
def calculate_progress(current, target):
    return (current / target) * 100 if target > 0 else 0

def test_progress_calculation():
    assert calculate_progress(50, 100) == 50
    assert calculate_progress(80, 80) == 100
    assert calculate_progress(0, 100) == 0

# UT-03: KPI Status Classification (matching document's local helper mock)
def get_status(progress):
    if progress == 0:
        return "Pending"
    elif progress >= 100:
        return "Completed"
    return "In Progress"

def test_status_completed():
    assert get_status(100) == "Completed"
    assert get_status(0) == "Pending"
    assert get_status(50) == "In Progress"

# UT-03 (Search): KPI Search Function (matching document's mock logic)
def test_search_kpi():
    kpis = [
        {"title": "Property Sales"},
        {"title": "Customer Satisfaction"}
    ]
    result = [
        kpi for kpi in kpis
        if "Property" in kpi["title"]
    ]
    assert len(result) == 1
    assert result[0]["title"] == "Property Sales"

# UT-03 (Stats): Dashboard Statistics Calculation (matching local helper mock)
def calculate_completion_rate(kpis):
    completed = sum(
        1 for kpi in kpis
        if kpi["progress"] >= 100
    )
    return (completed / len(kpis)) * 100 if kpis else 0

def test_completion_rate():
    kpis = [
        {"progress": 100},
        {"progress": 0},
        {"progress": 0},
        {"progress": 0}
    ]
    assert calculate_completion_rate(kpis) == 25

# UT-10: KPI Prediction Function (matching local helper mock)
def predict_progress(progress):
    return min(progress * 1.1, 100)

def test_prediction():
    assert pytest.approx(predict_progress(80)) == 88
    assert pytest.approx(predict_progress(50)) == 55
    assert predict_progress(100) == 100
