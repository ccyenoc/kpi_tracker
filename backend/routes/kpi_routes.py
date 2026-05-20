from fastapi import APIRouter, Request
from models.kpi_model import KPICreate, KPIUpdate
from services.kpi_service import (
    get_kpis,
    get_kpi,
    create_kpi,
    update_kpi,
    delete_kpi,
    update_kpi_progress_service,
    get_kpi_history
)
from services.predictionService import predict_kpi;
from fastapi import Form, File, UploadFile
from typing import List

router = APIRouter()

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
    return predict_kpi(
        kpi_id,
        request
    )