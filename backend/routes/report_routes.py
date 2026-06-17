from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

from services.kpi_service import get_weekly_kpi, get_monthly_kpi
from services.auth_service import get_current_user_from_request
from config.firebase_config import db
from firebase_secure import KPI_COLLECTION

router = APIRouter()


def get_user_name(user_id):
    try:
        # Check by document ID first
        doc = db.collection("userData").document(user_id).get()
        if doc.exists:
            data = doc.to_dict()
            if data and data.get("name"):
                return data["name"]

        # Fallback to field query
        users_ref = db.collection("userData")
        query = users_ref.where("userId", "==", user_id).limit(1).stream()

        for doc in query:
            data = doc.to_dict()
            return data.get("name", user_id)

        return user_id

    except Exception as e:
        print("USER LOOKUP ERROR:", e)
        return user_id


@router.get("/report/weekly")
def weekly_report():
    try:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)

        data = get_weekly_kpi()
        summary = data.get("summary", {})
        kpis = data.get("kpis", [])

        width, height = letter

        title = "Weekly KPI Report"

        p.setFont("Helvetica-Bold", 16)

        text_width = p.stringWidth(title, "Helvetica-Bold", 16)

        p.drawString((width - text_width) / 2, 750, title)

        p.setFont("Helvetica", 12)

        p.drawString(
            50,
            700,
            f"Total Active KPIs: {summary.get('totalActiveKpis', 0)}"
        )

        p.drawString(
            50,
            680,
            f"Total Assignments: {summary.get('totalAssignments', 0)}"
        )

        p.drawString(
            50,
            660,
            f"Average Progress: {summary.get('averageProgress', 0)}%"
        )

        y = 620

        p.setFont("Helvetica-Bold", 13)
        p.drawString(50, y, "KPI Details")
        y -= 25

        for kpi in kpis:
            title = kpi.get("title", "No Title")

            p.setFont("Helvetica-Bold", 12)
            p.drawString(50, y, f"KPI: {title}")
            y -= 15

            p.setFont("Helvetica", 10)

            description = kpi.get("description", "No description")

            p.drawString(50, y, f"Description: {description}")
            y -= 12

            target = kpi.get("target", 0)
            unit = kpi.get("unit", "")

            p.drawString(50, y, f"Target: {target} {unit}")
            y -= 12

            progress = kpi.get("progress", 0)

            p.drawString(50, y, f"Overall Progress: {progress}%")
            y -= 18

            p.setFont("Helvetica-Bold", 10)

            p.drawString(50, y, "Staff")
            p.drawString(200, y, "Target")
            p.drawString(260, y, "Current")
            p.drawString(330, y, "Progress %")

            y -= 10

            p.line(50, y, 400, y)

            y -= 15

            p.setFont("Helvetica", 10)

            for a in kpi.get("kpiAssignments", []):
                user_id = a.get("userId", "")
                name = get_user_name(user_id)

                target = a.get("target", 0)
                current = a.get("current", 0)
                progress = a.get("progress", 0)

                p.drawString(50, y, name)
                p.drawString(200, y, str(target))
                p.drawString(260, y, str(current))
                p.drawString(330, y, f"{progress}%")

                y -= 15

                if y < 50:
                    p.showPage()
                    p.setFont("Helvetica", 10)
                    y = 750

            y -= 10

        p.showPage()
        p.save()

        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=weekly_report.pdf"
            }
        )

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}


@router.get("/report/monthly")
def monthly_report():
    try:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)

        width, height = letter

        data = get_monthly_kpi()

        summary = data.get("summary", {})
        completed = data.get("completed", [])
        active = data.get("active", [])

        title = "Monthly KPI Report"

        p.setFont("Helvetica-Bold", 16)

        text_width = p.stringWidth(title, "Helvetica-Bold", 16)

        p.drawString((width - text_width) / 2, 750, title)

        p.setFont("Helvetica", 12)

        p.drawString(
            50,
            700,
            f"Total KPIs: {summary.get('totalKpis', 0)}"
        )

        p.drawString(
            50,
            680,
            f"Completed KPIs: {summary.get('completedKpis', 0)}"
        )

        p.drawString(
            50,
            660,
            f"Active KPIs: {summary.get('activeKpis', 0)}"
        )

        p.drawString(
            50,
            640,
            f"Average Progress: {summary.get('averageProgress', 0)}%"
        )

        y = 600

        p.setFont("Helvetica-Bold", 13)
        p.drawString(50, y, "Completed KPIs")
        y -= 20

        p.setFont("Helvetica-Bold", 10)
        p.drawString(50, y, "KPI Title")
        p.drawString(250, y, "Target")
        p.drawString(320, y, "Progress")

        y -= 10
        p.line(50, y, 400, y)
        y -= 15

        p.setFont("Helvetica", 10)

        for kpi in completed:
            p.drawString(50, y, kpi.get("title", ""))
            p.drawString(250, y, str(kpi.get("target", 0)))
            p.drawString(320, y, f"{kpi.get('progress', 100)}%")
            y -= 15

            if y < 50:
                p.showPage()
                y = 750

        y -= 20

        p.setFont("Helvetica-Bold", 13)
        p.drawString(50, y, "Active KPIs")
        y -= 20

        for kpi in active:
            title = kpi.get("title", "No Title")

            p.setFont("Helvetica-Bold", 12)
            p.drawString(50, y, f"KPI: {title}")
            y -= 15

            p.setFont("Helvetica", 10)

            description = kpi.get("description", "")
            p.drawString(50, y, f"Description: {description}")
            y -= 12

            target = kpi.get("target", 0)
            unit = kpi.get("unit", "")

            p.drawString(50, y, f"Target: {target} {unit}")
            y -= 12

            progress = kpi.get("progress", 0)
            p.drawString(50, y, f"Overall Progress: {progress}%")
            y -= 18

            p.setFont("Helvetica-Bold", 10)

            p.drawString(50, y, "Staff")
            p.drawString(200, y, "Target")
            p.drawString(260, y, "Current")
            p.drawString(330, y, "Progress %")

            y -= 10
            p.line(50, y, 400, y)
            y -= 15

            p.setFont("Helvetica", 10)

            for a in kpi.get("kpiAssignments", []):
                user_id = a.get("userId", "")
                name = get_user_name(user_id)

                target = a.get("target", 0)
                current = a.get("current", 0)
                progress = a.get("progress", 0)

                p.drawString(50, y, name)
                p.drawString(200, y, str(target))
                p.drawString(260, y, str(current))
                p.drawString(330, y, f"{progress}%")

                y -= 15

                if y < 50:
                    p.showPage()
                    y = 750

            y -= 15

        p.showPage()
        p.save()

        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=monthly_report.pdf"
            }
        )

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}


@router.get("/report/monthly/me")
def my_monthly_report(request: Request):
    try:
        current_user = get_current_user_from_request(request)

        if not current_user:
            return {"error": "Unauthorized"}

        user_id = current_user.get("id")
        user_name = get_user_name(user_id)
        if user_name == user_id:
            user_name = "Staff"

        kpi_docs = db.collection(KPI_COLLECTION).stream()

        completed_kpis = []
        active_kpis = []

        for doc in kpi_docs:
            data = doc.to_dict() or {}
            data["id"] = doc.id

            assignments = data.get("kpiAssignments", [])

            user_assignment = next(
                (a for a in assignments if a.get("userId") == user_id),
                None
            )

            if not user_assignment:
                continue

            target = user_assignment.get("target", 1)
            current_val = user_assignment.get("current", 0)

            progress = round(
                (current_val / target) * 100,
                2
            ) if target > 0 else 0

            kpi_entry = {
                "title": data.get("title", ""),
                "description": data.get("description", ""),
                "target": target,
                "unit": data.get("unit", ""),
                "current": current_val,
                "progress": progress,
                "status": data.get("status", ""),
                "deadline": data.get("deadline", ""),
            }

            if data.get("status") == "completed":
                completed_kpis.append(kpi_entry)
            else:
                active_kpis.append(kpi_entry)

        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)

        width, height = letter

        title_text = f"Monthly Performance Report - {user_name}"

        p.setFont("Helvetica-Bold", 15)

        text_width = p.stringWidth(
            title_text,
            "Helvetica-Bold",
            15
        )

        p.drawString((width - text_width) / 2, 750, title_text)

        total = len(completed_kpis) + len(active_kpis)

        avg = round(
            sum(
                k["progress"]
                for k in completed_kpis + active_kpis
            ) / total,
            2
        ) if total else 0

        p.setFont("Helvetica", 12)

        p.drawString(50, 710, f"Total KPIs: {total}")
        p.drawString(50, 692, f"Completed: {len(completed_kpis)}")
        p.drawString(50, 674, f"Active: {len(active_kpis)}")
        p.drawString(50, 656, f"Average Progress: {avg}%")

        y = 625

        def draw_kpi_table(kpi_list, section_title):
            nonlocal y

            p.setFont("Helvetica-Bold", 13)
            p.drawString(50, y, section_title)

            y -= 20

            p.setFont("Helvetica-Bold", 10)

            p.drawString(50, y, "KPI Title")
            p.drawString(260, y, "Target")
            p.drawString(320, y, "Current")
            p.drawString(390, y, "Progress %")

            y -= 10

            p.line(50, y, 480, y)

            y -= 15

            p.setFont("Helvetica", 10)

            for kpi in kpi_list:
                p.drawString(50, y, kpi["title"][:30])
                p.drawString(260, y, f"{kpi['target']} {kpi['unit']}")
                p.drawString(320, y, str(kpi["current"]))
                p.drawString(390, y, f"{kpi['progress']}%")

                y -= 15

                if y < 60:
                    p.showPage()
                    y = 750

            y -= 15

        draw_kpi_table(completed_kpis, "Completed KPIs")
        draw_kpi_table(active_kpis, "Active KPIs")

        p.showPage()
        p.save()

        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=monthly_report_{user_name.replace(' ', '_')}.pdf"
            }
        )

    except Exception as e:
        print("ERROR:", e)
        return {"error": str(e)}