from fastapi import HTTPException, status, Request
from google.cloud.firestore import FieldFilter
from datetime import datetime

from config.firebase_config import db
from firebase_secure import KPI_COLLECTION
from utils.auth_utils import require_manager


def get_kpis(request: Request):
    require_manager(request)

    try:
        kpi_ref = db.collection(KPI_COLLECTION)
        query = kpi_ref

        assigned_to = request.query_params.get("assignedTo")
        kpi_status  = request.query_params.get("status")

        if assigned_to:
            query = query.where(filter=FieldFilter("assignedTo", "==", assigned_to))
        if kpi_status:
            query = query.where(filter=FieldFilter("status", "==", kpi_status))

        kpis = []
        for doc in query.stream():
            data = doc.to_dict() or {}
            data["id"] = doc.id
            kpis.append(data)

        return {"success": True, "kpis": kpis}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_kpi(kpi_id: str, request: Request):
    require_manager(request)

    doc = db.collection(KPI_COLLECTION).document(kpi_id).get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="KPI not found")

    data = doc.to_dict() or {}
    data["id"] = doc.id

    return {"success": True, "kpi": data}


def create_kpi(kpi_data, request: Request):
    decoded = require_manager(request)
    manager_id = decoded.get("user_id")

    now = datetime.utcnow().isoformat()

    doc_data = {
        "title": kpi_data.title.strip(),
        "description": kpi_data.description or "",
        "category": kpi_data.category or "",
        "target": kpi_data.target,
        "unit": kpi_data.unit or "",
        "frequency": kpi_data.frequency or "",
        "assignedTo": kpi_data.assignedTo or "",
        "deadline": kpi_data.deadline or "",
        "status": "active",
        "createdBy": manager_id,
        "createdAt": now,
        "updatedAt": now,
    }

    new_ref = db.collection(KPI_COLLECTION).document()
    new_ref.set(doc_data)

    doc_data["id"] = new_ref.id

    return {"success": True, "kpi": doc_data}


def update_kpi(kpi_id: str, kpi_data, request: Request):
    decoded = require_manager(request)
    manager_id = decoded.get("user_id")

    kpi_ref = db.collection(KPI_COLLECTION).document(kpi_id)
    kpi_doc = kpi_ref.get()

    if not kpi_doc.exists:
        raise HTTPException(status_code=404, detail="KPI not found")

    update_fields = {
        k: v for k, v in kpi_data.model_dump(exclude_unset=True).items() if v is not None
    }

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields["updatedAt"] = datetime.utcnow().isoformat()
    update_fields["updatedBy"] = manager_id

    kpi_ref.update(update_fields)

    updated_doc = kpi_ref.get().to_dict() or {}
    updated_doc["id"] = kpi_id

    return {"success": True, "kpi": updated_doc}


def delete_kpi(kpi_id: str, request: Request):
    require_manager(request)

    kpi_ref = db.collection(KPI_COLLECTION).document(kpi_id)
    kpi_doc = kpi_ref.get()

    if not kpi_doc.exists:
        raise HTTPException(status_code=404, detail="KPI not found")

    kpi_ref.delete()

    return {"success": True}