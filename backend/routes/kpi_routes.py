from fastapi import APIRouter, Request
from models.kpi_model import KPICreate, KPIUpdate
from services.kpi_service import (
    get_kpis,
    get_kpi,
    create_kpi,
    update_kpi,
    delete_kpi
)

router = APIRouter()


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