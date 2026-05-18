from fastapi import HTTPException, status, Request
from google.cloud.firestore import FieldFilter
from datetime import datetime
from email.message import EmailMessage
from config.firebase_config import db
from firebase_secure import KPI_COLLECTION
from utils.auth_utils import require_manager
from typing import List
from fastapi import UploadFile
from pathlib import Path
import uuid
from utils.auth_utils import require_user

import os , smtplib , threading

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").strip().lower() in ("1", "true", "yes", "on")


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
    

    for user_id in kpi_data.assignedUserIds:
        user = get_user_info(user_id)

        print("👤 User:", user)

        if user:
         send_kpi_assignment_email(
            to_email=user["email"],
            staff_name=user["name"],
            kpi_title=kpi_data.title,
            deadline=kpi_data.deadline
        )

    return {"success": True, "kpi": doc_data}

def get_user_info(user_id):
    try:
        doc = db.collection("userData").document(user_id).get()

        if doc.exists:
            data = doc.to_dict()
            return {
                "name": data.get("name"),
                "email": data.get("email")
            }

        return None

    except Exception as e:
        print("USER FETCH ERROR:", e)
        return None


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
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD or not SMTP_FROM:
        raise HTTPException(
            status_code=500,
            detail="SMTP not configured properly"
        )

    msg = EmailMessage()
    msg["Subject"] = f"New KPI Assigned: {kpi_title}"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email

    msg.set_content(
        f"Hi {staff_name},\n\n"
        f"You have been assigned a new KPI:\n\n"
        f"Title: {kpi_title}\n"
        f"Deadline: {deadline}\n\n"
        f"Please log in to view details.\n\n"
        f"Best regards,\nKPI System"
    )

    try:
        print("📩 Connecting to SMTP...")

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            if SMTP_USE_TLS:
                server.starttls()

            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        print("✅ Email sent to", to_email)

    except Exception as e:
        print("❌ EMAIL ERROR:", e)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send KPI email: {str(e)}"
        )
    
#for the staff submission
def get_kpi_by_id(kpi_id):
    doc = db.collection(KPI_COLLECTION).document(kpi_id).get()
    if doc.exists:
        return doc.to_dict()
    return None

async def update_kpi_progress_service(kpiId, current, notes, files: List[UploadFile], request: Request):
    try:
        # 🔥 get staff from token
        decoded = require_user(request)
        staff_id = decoded.get("user_id")

        staff = get_user_info(staff_id)

        # 🔥 upload files
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)

        saved_files = []

        for file in files:
            if not file.filename:
                continue

            original_name = Path(file.filename).name
            stored_name = f"{uuid.uuid4()}_{original_name}"
            file_path = os.path.join(upload_dir, stored_name)

            content = await file.read()

            with open(file_path, "wb") as f:
                f.write(content)

            saved_files.append({
                "originalName": original_name,
                "storedName": stored_name,
                "path": file_path.replace("\\", "/")
            })

        # 🔥 create submission
        submission_id = str(int(datetime.now().timestamp() * 1000))

        new_submission = {
            "id": submission_id,
            "kpiId": kpiId,
            "current": current,
            "notes": notes,
            "files": saved_files,
            "submittedAt": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "pending",
            "submittedBy": staff_id
        }

        db.collection("kpiSubmissions").document(submission_id).set(new_submission)
        print("🔥 Received KPI ID:", kpiId)
        print("🔥 KPI doc exists:", get_kpi_by_id(kpiId))

        # 🔥 GET KPI → manager
        ###################### HARDCODE KPIID FOR EMAIL SENDING TESTING#########################
        kpi = get_kpi_by_id("9UWLxM7bmLImC3wreUUK")

        if kpi:
            manager_id = kpi.get("createdBy")
            manager = get_user_info(manager_id)

            print("👤 Staff:", staff)
            print("👤 Manager:", manager)

            # 📩 email manager
            if manager:
                send_email(
                    manager["email"],
                    "New KPI Submission",
                    f"""
                        Hi {manager['name']},

                        A new KPI submission has been made.

                        KPI: {kpi.get('title')}
                        Submitted by: {staff['name'] if staff else 'Staff'}
                        Current Value: {current}

                        Please review it.

                        KPI System
                    """
                )

            # 📩 email staff (confirmation)
            if staff:
                send_email(
                    staff["email"],
                    "Submission Successful",
                    f"""
                    Hi {staff['name']},

                    Your KPI submission has been recorded.

                    KPI: {kpi.get('title')}
                    Current Value: {current}

                    Thank you.

                    KPI System
                    """
                )

        return {
            "success": True,
            "message": "Submission saved",
            "submission": new_submission
        }

    except Exception as e:
        print("🔥 ERROR:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
def send_email(to_email, subject, content):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(content)

    try:
        print("📩 Connecting to SMTP...")

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            if SMTP_USE_TLS:
                server.starttls()

            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)

        print("✅ Email sent to", to_email)

    except Exception as e:
        print("❌ EMAIL ERROR:", e)

