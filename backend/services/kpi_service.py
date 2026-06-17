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
from collections import defaultdict
from datetime import datetime
from services.prediction_service import calculate_trajectory_prediction

import os , smtplib , threading

SMTP_HOST = os.getenv("SMTP_HOST", "") # address of mail server
SMTP_PORT = int(os.getenv("SMTP_PORT", "587")) # port number 
SMTP_USER = os.getenv("SMTP_USER", "") # login details of system's email submission
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "") # login details of system's email submission
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER) # sender's email address
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").strip().lower() in ("1", "true", "yes", "on") # to determine the connection should be encrypted or not 


def get_kpis(request: Request):
    require_manager(request)

    try:
        kpi_ref = db.collection(KPI_COLLECTION)
        query = kpi_ref

        assigned_to = request.query_params.get("assignedTo")
        kpi_status  = request.query_params.get("status")

        if assigned_to:
            query = query.where(filter=FieldFilter("assignedUserIds", "array_contains", assigned_to))
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
    
def get_staff_kpis(request: Request):
    decoded = require_user(request)

    staff_id = (
        decoded.get("user_id")
        or decoded.get("id")
        or decoded.get("uid")
        or decoded.get("sub")
    )

    if not staff_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing user id")

    try:
        kpi_ref = db.collection(KPI_COLLECTION)

        query = kpi_ref.where( filter=FieldFilter("assignedUserIds", "array_contains", staff_id) )

        kpis = []

        for doc in query.stream():
            data = doc.to_dict() or {}
            data["id"] = doc.id
            kpis.append(data)

        return {
            "success": True,
            "kpis": kpis
        }

    except Exception as e:
        print("GET STAFF KPI ERROR:", repr(e))
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

    "status": "active",
    "createdBy": manager_id,
    "createdAt": now,
    "updatedAt": now,
    }

    new_ref = db.collection(KPI_COLLECTION).document()
    new_ref.set(doc_data)

    doc_data["id"] = new_ref.id
    

    for user_id in kpi_data.assignedUserIds:
        user = get_user_info(user_id)

        print("User:", user)

        if user:
            try:
                send_kpi_assignment_email(
                    to_email=user["email"],
                    staff_name=user["name"],
                    kpi_title=kpi_data.title,
                    deadline=kpi_data.deadline
                )
            except Exception as email_err:
                print(f"Failed to send KPI assignment email to {user['email']}: {email_err}")

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

    # Get assigned user IDs before deleting the document
    kpi_data = kpi_doc.to_dict() or {}
    assigned_user_ids = kpi_data.get("assignedUserIds", [])

    # Delete the main KPI document
    kpi_ref.delete()

    # Clean up assignedKpis references inside userData (DI-01)
    for user_id in assigned_user_ids:
        user_ref = db.collection("userData").document(user_id)
        user_doc = user_ref.get()
        if user_doc.exists:
            user_data = user_doc.to_dict() or {}
            assigned_kpis = user_data.get("assignedKpis", [])
            if kpi_id in assigned_kpis:
                assigned_kpis.remove(kpi_id)
                user_ref.update({"assignedKpis": assigned_kpis})

    # Clean up associated submissions (DI-05)
    submissions = db.collection("kpiSubmissions").where("kpiId", "==", kpi_id).stream()
    for sub in submissions:
        sub.reference.delete()

    return {"success": True}



# to generate weekly report
def get_weekly_kpi():
    try:
        from datetime import timedelta
        kpi_ref = db.collection(KPI_COLLECTION)

        query = kpi_ref.where("status", "!=", "completed")

        kpis = []
        total_tasks = 0
        total_progress = 0

        now = datetime.utcnow()
        # get the date 7 days before
        start_date = now - timedelta(days=7)
        end_date = now

        for doc in query.stream():
            data = doc.to_dict() or {}
            data["id"] = doc.id

             # date filtering logic
            date_in_range = False
            has_dates = False
            for date_field in ["createdAt", "updatedAt"]:
                date_str = data.get(date_field)
                if date_str:
                    has_dates = True
                    try:
                        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00").split("+")[0])
                        if start_date <= dt <= end_date:
                            date_in_range = True
                            break
                    except:
                        pass
            if has_dates and not date_in_range:
                continue

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
            "kpis": kpis
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

        now = datetime.utcnow()
        
        # get current month
        start_of_month = datetime(now.year, now.month, 1)

        # get next month
        if now.month == 12:
            end_of_month = datetime(now.year + 1, 1, 1)
        else:
            end_of_month = datetime(now.year, now.month + 1, 1)

        for doc in docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id

            # date filtering logic
            date_in_range = False
            has_dates = False
            for date_field in ["createdAt", "updatedAt"]:
                date_str = data.get(date_field)
                if date_str:
                    has_dates = True
                    try:
                        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00").split("+")[0])
                        if start_of_month <= dt < end_of_month:
                            date_in_range = True
                            break
                    except:
                        pass
            if has_dates and not date_in_range:
                continue

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

            # Categorize into completed or active
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

    subject = f"New KPI Assigned: {kpi_title}"
    content = (
        f"Hi {staff_name},\n\n"
        f"You have been assigned a new KPI:\n\n"
        f"Title: {kpi_title}\n"
        f"Deadline: {deadline}\n\n"
        f"Please log in to view details.\n\n"
        f"Best regards,\nKPI System"
    )
    
    send_email(to_email, subject, content)

#for the staff submission
def get_kpi_by_id(kpi_id):
    doc = db.collection(KPI_COLLECTION).document(kpi_id).get()
    if doc.exists:
        return doc.to_dict()
    return None

async def update_kpi_progress_service(kpiId, current, notes, files: List[UploadFile], request: Request):
    try:
        # get staff from token
        decoded = require_user(request)
        staff_id = decoded.get("user_id")

        staff = get_user_info(staff_id)

        # upload files
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

        # Create submission
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
        print("Received KPI ID:", kpiId)
        print("KPI doc exists:", get_kpi_by_id(kpiId))

        # Retrieve manager info
        kpi = get_kpi_by_id(kpiId)

        if kpi:
            manager_id = kpi.get("createdBy")
            manager = get_user_info(manager_id)

            print("Staff:", staff)
            print("Manager:", manager)

            # email manager
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

            # email staff (confirmation)
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
        print("Error updating KPI progress:", e)
        raise HTTPException(status_code=500, detail=str(e))
    
def send_email(to_email, subject, content):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.set_content(content)

    try:
        print("Connecting to SMTP...")

        # open network connection to te email server (port 587)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            
            if SMTP_USE_TLS:
                server.starttls() #upgrade connection to use encrypted tls encryption 
            
            # login into the account
            server.login(SMTP_USER, SMTP_PASSWORD) 
            server.send_message(msg)

        print("Email sent to", to_email)

    except Exception as e:
        print("Email error:", e)

from collections import defaultdict
from datetime import datetime


def get_kpi_history(request: Request):

    data = get_kpis(request)
    kpis = data["kpis"]

    if not kpis:
        return { "success": True, "chart": [] }

    total_expected = 0
    total_progress = 0
    total_prediction = 0
    count = 0

    today = datetime.utcnow()

    for kpi in kpis:

        deadline = kpi.get("deadline")

        assignments = kpi.get(
            "kpiAssignments",
            []
        )

        expected = 0

        if deadline:

            try:
                due = datetime.fromisoformat( deadline.replace("Z", "+00:00") )
                created = datetime.fromisoformat(kpi["createdAt"])

                total_days = (due - created).days
                days_elapsed = (today - created).days
                
                if total_days <= 0:
                    expected = 100
                else:
                    expected = min(( days_elapsed / total_days ) * 100, 100 )

            except:
                expected = 50


        for a in assignments:

            current = a.get("current", 0 )

            target = a.get( "target",1 )

            if target <= 0:
                continue

            progress = ( current / target ) * 100
            
            prediction = calculate_trajectory_prediction(
                current,
                target,
                kpi.get("createdAt"),
                deadline
            )

            total_expected += expected
            total_progress += progress
            total_prediction += prediction

            count += 1


    if count == 0:

        return {
            "success": True,
            "chart": []
        }


    avg_expected = ( total_expected / count )
    avg_progress = ( total_progress / count )
    avg_prediction = ( total_prediction / count )


    chart = []

    for week in range(1, 5):
        week_ratio = week / 5
        chart.append({
            "time": f"Week {week}",
            "expected": round(avg_expected * week_ratio, 1),
            "progress": round(avg_progress * week_ratio, 1),
            "prediction": round(avg_prediction * week_ratio, 1)
        })

    return {
        "success" : True,
        "chart" : chart
    }

def get_staff_kpi_submissions(request: Request):
    decoded = require_user(request)
    staff_id = decoded.get("user_id")

    try:
        submissions_ref = db.collection("kpiSubmissions")
        query = submissions_ref.where(
            filter=FieldFilter("submittedBy", "==", staff_id)
        )

        submissions = []

        for doc in query.stream():
            data = doc.to_dict() or {}
            data["id"] = doc.id
            submissions.append(data)

        submissions.sort(
            key=lambda x: x.get("submittedAt", ""),
            reverse=False
        )

        return {
            "success": True,
            "submissions": submissions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
