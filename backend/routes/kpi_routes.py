from fastapi import APIRouter, Request
from models.kpi_model import KPICreate, KPIUpdate
from services.kpi_service import (
    get_kpis,
    get_kpi,
    get_staff_kpis,
    get_staff_kpi_submissions,
    create_kpi,
    update_kpi,
    delete_kpi,
    update_kpi_progress_service,
    get_kpi_history
)
from utils.auth_utils import require_manager
from fastapi import Form, File, UploadFile
from typing import List
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.manager_service import (
    ManagerDashboardService,
    SubmissionVerificationService,
    KPIStatusService,
    KPIPredictionService,
    KPIAssignmentService,
    KPIReportService,
    AssignKPIRequest
)

router = APIRouter()

# Get all KPIs
@router.get("/manager/kpis")
def view_all_kpis(request: Request):
    return get_kpis(request)


# Get single KPI endpoint
from fastapi import Form, File, UploadFile
from typing import List


# Get single KPI endpoint
@router.get("/manager/kpi")
def view_kpis(request: Request):
    return get_kpis(request)

@router.get("/manager/kpi/history")
def history(
    request: Request
):
    return get_kpi_history(
        request
    )


@router.get("/manager/kpi/{kpi_id}")
def view_kpi(kpi_id: str, request: Request):
    return get_kpi(kpi_id, request)


@router.post("/manager/kpi")
def create(kpi_data: KPICreate, request: Request):
    return create_kpi(kpi_data, request)


@router.put("/manager/kpi/{kpi_id}")
def update(kpi_id: str, kpi_data: KPIUpdate, request: Request):
    return update_kpi(kpi_id, kpi_data, request)


@router.delete("/manager/kpi/{kpi_id}")
def delete(kpi_id: str, request: Request):
    return delete_kpi(kpi_id, request)


# Manager Dashboard Stats (aggregated KPI data and staff rankings)
@router.get("/manager/dashboard/stats")
def get_dashboard_stats(request: Request):
    result = ManagerDashboardService.get_dashboard_stats()
    return result


# Get all KPI submissions (pending, approved, rejected)
@router.get("/kpi/submissions")
def get_submissions(request: Request):
    result = SubmissionVerificationService.get_all_submissions()
    if result["success"]:
        return {
            "success": True,
            "submissions": result.get("submissions", []),
            "count": result.get("count", 0)
        }
    return result


# Get at-risk KPIs (achievement rate 50-80%)
@router.get("/kpi/at-risk")
def get_at_risk_kpis(request: Request):
    result = KPIStatusService.get_at_risk_kpis()
    return result


# Get underperforming KPIs (achievement rate < 50%)
@router.get("/kpi/underperform")
def get_underperform_kpis(request: Request):
    result = KPIStatusService.get_underperform_kpis()
    return result

# Get staff's assigned KPIs
@router.get("/staff/kpis")
def get_staff_kpis(request: Request):
    from services.auth_service import get_current_user_from_request
    try:
        current_user = get_current_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Unauthorized"}
        
        user_id = current_user.get("id")
        
        # Get all KPIs assigned to this staff member
        from config.firebase_config import db
        from firebase_secure import KPI_COLLECTION
        
        kpis_ref = db.collection(KPI_COLLECTION).stream()
        staff_kpis = []
        
        for doc in kpis_ref:
            kpi_data = doc.to_dict()
            kpi_data["id"] = doc.id
            
            # Check if current user is in the assigned staff
            assignments = kpi_data.get("kpiAssignments", [])
            user_assignment = next((a for a in assignments if a.get("userId") == user_id), None)
            
            if user_assignment:
                kpi_data["userAssignment"] = user_assignment
                kpi_data["userTarget"] = user_assignment.get("target", 0)
                kpi_data["userCurrent"] = user_assignment.get("current", 0)
                staff_kpis.append(kpi_data)
        
        return {
            "success": True,
            "kpis": staff_kpis
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


# Get staff's monthly performance data
@router.get("/staff/monthly-performance")
def get_staff_monthly_performance(request: Request):
    from services.auth_service import get_current_user_from_request
    try:
        current_user = get_current_user_from_request(request)
        if not current_user:
            return {"success": False, "message": "Unauthorized"}
        
        user_id = current_user.get("id")
        
        from config.firebase_config import db
        from firebase_secure import KPI_COLLECTION
        from datetime import datetime, timedelta
        
        # Get all KPIs assigned to this staff member
        kpis_ref = db.collection(KPI_COLLECTION).stream()
        monthly_data = {}
        
        for doc in kpis_ref:
            kpi_data = doc.to_dict()
            
            # Check if current user is in the assigned staff
            assignments = kpi_data.get("kpiAssignments", [])
            user_assignment = next((a for a in assignments if a.get("userId") == user_id), None)
            
            if not user_assignment:
                continue
            
            # Get submissions for this KPI from this user
            submissions_ref = db.collection("kpiSubmissions").where("kpiId", "==", doc.id).where("userId", "==", user_id).stream()
            
            for submission_doc in submissions_ref:
                submission = submission_doc.to_dict()
                submitted_date = submission.get("submittedAt")
                
                if isinstance(submitted_date, str):
                    try:
                        submitted_date = datetime.fromisoformat(submitted_date.replace('Z', '+00:00'))
                    except:
                        submitted_date = datetime.now()
                
                month = submitted_date.strftime("%b")
                week = (submitted_date.day - 1) // 7 + 1
                key = f"{month}-W{week}"
                
                if key not in monthly_data:
                    monthly_data[key] = {
                        "month": month,
                        "time": f"Week {week}",
                        "kpi": 0,
                        "progress": 0,
                        "prediction": 0,
                        "name": kpi_data.get("title", "")
                    }
                
                target = user_assignment.get("target", 0)
                current = submission.get("current", 0)
                
                monthly_data[key]["kpi"] += target
                monthly_data[key]["progress"] += current
                monthly_data[key]["prediction"] += current + 5  # Simple prediction
        
        return {
            "success": True,
            "data": list(monthly_data.values())
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/staff/kpi")
def view_staff_kpis(request: Request):
    return get_staff_kpis(request)

@router.post("/kpi/update")
async def update_kpi_progress(
    kpiId: str = Form(...),
    current: float = Form(...),
    notes: str = Form(""),
    files: List[UploadFile] = File(default=[]),
    request: Request = None
):
    return await update_kpi_progress_service(kpiId, current, notes, files, request)
@router.get("/manager/kpi/{kpi_id}/predict")
def predict(
    kpi_id: str,
    request: Request
):
    require_manager(request)
    return KPIPredictionService.predict_kpi_outcome(kpi_id)


# Download evidence files
@router.get("/kpi/evidence/{file_name}")
def download_evidence(file_name: str):
    from fastapi.responses import FileResponse
    try:
        # Ensure file_name doesn't contain path traversal attacks
        if ".." in file_name or "/" in file_name or "\\" in file_name:
            return {"success": False, "message": "Invalid file name"}
        
        full_path = os.path.join("uploads", file_name)

        if not os.path.exists(full_path):
            return {"success": False, "message": "File not found"}

        return FileResponse(full_path, media_type="application/octet-stream")
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/kpi/evidence-list")
def list_evidence_files():
    try:
        if not os.path.exists("uploads"):
            return {"success": True, "files": [], "message": "uploads folder does not exist"}
        
        files = os.listdir("uploads")
        return {"success": True, "files": files, "count": len(files)}
    except Exception as e:
        return {"success": False, "message": str(e)}


# Verify (approve/reject) a submission
@router.post("/kpi/verify-submission")
async def verify_submission(request: Request):
    try:
        from services.auth_service import get_current_user_from_request
        import json
        
        try:
            decoded = get_current_user_from_request(request)
            manager_id = decoded.get("id") or decoded.get("user_id")
        except:
            return {"success": False, "message": "Unauthorized"}
        
        # Get request body
        body = await request.json()
        submission_id = body.get("submissionId")
        kpi_id = body.get("kpiId")
        status = body.get("status")  # "approved" or "rejected"
        comments = body.get("comments", "")

        if not all([submission_id, kpi_id, status]):
            return {"success": False, "message": "Missing required fields"}
        
        if status not in ["approved", "rejected"]:
            return {"success": False, "message": "Invalid status"}
        
        # Update submission in Firestore
        result = SubmissionVerificationService.verify_submission(
            submission_id, kpi_id, status, comments, manager_id
        )

        return result
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/staff/kpi/submissions")
def view_staff_kpi_submissions(request: Request):
    return get_staff_kpi_submissions(request)


# Assign KPI to staff members
@router.post("/manager/kpi/{kpi_id}/assign")
def assign_kpi(kpi_id: str, assign_data: AssignKPIRequest, request: Request):
    decoded = require_manager(request)
    manager_id = decoded.get("id") or decoded.get("user_id")
    return KPIAssignmentService.assign_kpi_to_staff(kpi_id, assign_data.assignments, manager_id)


# Get KPI assignment details
@router.get("/manager/kpi/{kpi_id}/assignments")
def get_assignments(kpi_id: str, request: Request):
    require_manager(request)
    return KPIAssignmentService.get_kpi_assignments(kpi_id)


# Generate JSON structured performance report for a KPI
@router.get("/manager/kpi/{kpi_id}/report")
def get_kpi_report(kpi_id: str, request: Request):
    require_manager(request)
    return KPIReportService.generate_report(kpi_id)


# Export KPI performance report data as CSV
@router.get("/manager/kpi/{kpi_id}/report/csv")
def export_kpi_report(kpi_id: str, request: Request):
    require_manager(request)
    result = KPIReportService.export_report_data(kpi_id)
    if result.get("success"):
        from fastapi.responses import Response
        return Response(
            content=result["csvContent"],
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={result['fileName']}"}
        )
    return result