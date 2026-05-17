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
    "categoryId": kpi_data.categoryId or "",
    "categoryName": kpi_data.categoryName or "",
    "target": kpi_data.target,
    "unit": kpi_data.unit or "",
    "deadline": kpi_data.deadline,
    
    "assignedUserIds": kpi_data.assignedUserIds or [],
    "kpiAssignments": [a.dict() for a in kpi_data.kpiAssignments] if kpi_data.kpiAssignments else [],

    "status": "pending",
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

# to generate weekly report
def get_weekly_kpi():
    try:
        kpi_ref = db.collection(KPI_COLLECTION)

        query = kpi_ref.where("status", "!=", "completed")

        kpis = []
        total_tasks = 0
        total_progress = 0

        for doc in query.stream():
            data = doc.to_dict() or {}
            data["id"] = doc.id

            # calculate KPI-level progress
            assignments = data.get("kpiAssignments", [])

            kpi_total = 0
            kpi_count = 0

            for a in assignments:
                current = a.get("current", 0)
                target = a.get("target", 1)

                if target > 0:
                    progress = (current / target) * 100
                    a["progress"] = round(progress, 2)

                    total_progress += (current / target)
                    total_tasks += 1

                    kpi_total += progress
                    kpi_count += 1

            # average KPI progress
            data["progress"] = round(kpi_total / kpi_count, 2) if kpi_count else 0

            kpis.append(data)

        avg_progress = (total_progress / total_tasks * 100) if total_tasks else 0

        return {
            "success": True,
            "summary": {
                "totalActiveKpis": len(kpis),
                "totalAssignments": total_tasks,
                "averageProgress": round(avg_progress, 2)
            },
            "kpis": kpis   # 🔥 FULL DATA
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

def get_monthly_kpi():
    try:
        kpi_ref = db.collection(KPI_COLLECTION)

        docs = kpi_ref.stream()

        completed_kpis = []
        active_kpis = []

        total_tasks = 0
        total_progress = 0

        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id

            assignments = data.get("kpiAssignments", [])

            kpi_total = 0
            kpi_count = 0

            for a in assignments:
                current = a.get("current", 0)
                target = a.get("target", 1)

                if target > 0:
                    progress = (current / target) * 100
                    a["progress"] = round(progress, 2)

                    total_progress += (current / target)
                    total_tasks += 1

                    kpi_total += progress
                    kpi_count += 1

            # KPI overall progress
            data["progress"] = round(kpi_total / kpi_count, 2) if kpi_count else 0

            # 🔥 SPLIT LOGIC
            if data.get("status") == "completed":
                completed_kpis.append(data)
            else:
                active_kpis.append(data)

        avg_progress = (total_progress / total_tasks * 100) if total_tasks else 0

        return {
            "success": True,
            "summary": {
                "totalKpis": len(completed_kpis) + len(active_kpis),
                "completedKpis": len(completed_kpis),
                "activeKpis": len(active_kpis),
                "averageProgress": round(avg_progress, 2)
            },
            "completed": completed_kpis,
            "active": active_kpis
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
def send_kpi_assignment_email(to_email, staff_name, kpi_title, deadline):
    msg = EmailMessage()
    msg["Subject"] = f"New KPI Assigned: {kpi_title}"
    msg["From"] = os.getenv("SMTP_FROM")
    msg["To"] = to_email

    msg.set_content(f"""
Hi {staff_name},

You have been assigned a new KPI:

Title: {kpi_title}
Deadline: {deadline}

Please log in to the system to view details.

Best regards,
KPI System
""")

    with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT"))) as server:
        server.starttls()
        server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD"))
        server.send_message(msg)