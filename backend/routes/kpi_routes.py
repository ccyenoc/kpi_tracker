from fastapi import APIRouter, Request
from models.kpi_model import KPICreate, KPIUpdate
from services.kpi_service import (
    get_kpis,
    get_kpi,
    create_kpi,
    update_kpi,
    delete_kpi,
    update_kpi_progress_service
)
from fastapi import Form, File, UploadFile
from typing import List
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from manager_service import ManagerDashboardService, SubmissionVerificationService, KPIStatusService

router = APIRouter()


# Get all KPIs (plural endpoint for frontend)
@router.get("/manager/kpis")
def view_all_kpis(request: Request):
    return get_kpis(request)


# Get single KPI endpoint
from fastapi import Form, File, UploadFile
from typing import List


# Get all KPIs (plural endpoint for frontend)
@router.get("/manager/kpis")
def view_all_kpis(request: Request):
    return get_kpis(request)


# Get single KPI endpoint
@router.get("/manager/kpi")
def view_kpis(request: Request):
    return get_kpis(request)


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
    result = SubmissionVerificationService.get_pending_submissions()
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

@router.post("/kpi/update")
async def update_kpi_progress(
    kpiId: str = Form(...),
    current: float = Form(...),
    notes: str = Form(""),
    files: List[UploadFile] = File(default=[]),
    request: Request = None
):
    return await update_kpi_progress_service(kpiId, current, notes, files, request)
