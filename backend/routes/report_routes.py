from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

from services.kpi_service import get_weekly_kpi

router = APIRouter()

@router.get("/report/weekly")
def weekly_report():
    try:
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)

        data = get_weekly_kpi()
        summary = data.get("summary", {})
        kpis = data.get("kpis", [])

        #title
       
        width, height = letter

        title = "Weekly KPI Report"

        p.setFont("Helvetica-Bold", 16)

        text_width = p.stringWidth(title, "Helvetica-Bold", 16)

        p.drawString((width - text_width) / 2, 750, title)

        #summary
        p.setFont("Helvetica", 12)
        p.drawString(50, 700, f"Total Active KPIs: {summary.get('totalActiveKpis', 0)}")
        p.drawString(50, 680, f"Total Assignments: {summary.get('totalAssignments', 0)}")
        p.drawString(50, 660, f"Average Progress: {summary.get('averageProgress', 0)}%")

        #kpi details
        y = 620

        p.setFont("Helvetica-Bold", 13)
        p.drawString(50, y, "KPI Details")
        y -= 25

        for kpi in kpis:
            title = kpi.get("title", "No Title")

            #kpi title
            p.setFont("Helvetica-Bold", 12)
            p.drawString(50, y, f"KPI: {title}")
            y -= 15

            #kpi description
            p.setFont("Helvetica", 10)
            description = kpi.get("description", "No description")
            p.drawString(50, y, f"Description: {description}")
            y -= 12

            #kpi target and unit
            target = kpi.get("target", 0)
            unit = kpi.get("unit", "")
            p.drawString(50, y, f"Target: {target} {unit}")
            y -= 12

            #kpi progres
            progress = kpi.get("progresss", 0)
            p.drawString(50, y, f"Overall Progress: {progress}%")
            y -= 18

            # table header
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y, "Staff")
            p.drawString(200, y, "Target")
            p.drawString(260, y, "Current")
            p.drawString(330, y, "Progress %")

            y -= 10
            p.line(50, y, 400, y)
            y -= 15

            # table rows
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

            y -= 10  # spacing between KPIs
             
            if y < 50:
                p.showPage()
                p.setFont("Helvetica", 10)
                y = 750

        # pdf
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

        # ===== TITLE =====
        title = "Monthly KPI Report"
        p.setFont("Helvetica-Bold", 16)
        text_width = p.stringWidth(title, "Helvetica-Bold", 16)
        p.drawString((width - text_width) / 2, 750, title)

        # ===== SUMMARY =====
        p.setFont("Helvetica", 12)
        p.drawString(50, 700, f"Total KPIs: {summary.get('totalKpis', 0)}")
        p.drawString(50, 680, f"Completed KPIs: {summary.get('completedKpis', 0)}")
        p.drawString(50, 660, f"Active KPIs: {summary.get('activeKpis', 0)}")
        p.drawString(50, 640, f"Average Progress: {summary.get('averageProgress', 0)}%")

        y = 600

        # =====================================================
        # ✅ COMPLETED KPI SECTION (TABLE)
        # =====================================================
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

        # =====================================================
        # ✅ ACTIVE KPI SECTION (DETAILED)
        # =====================================================
        p.setFont("Helvetica-Bold", 13)
        p.drawString(50, y, "Active KPIs")
        y -= 20

        for kpi in active:
            title = kpi.get("title", "No Title")

            # KPI TITLE
            p.setFont("Helvetica-Bold", 12)
            p.drawString(50, y, f"KPI: {title}")
            y -= 15

            # DESCRIPTION
            p.setFont("Helvetica", 10)
            description = kpi.get("description", "")
            p.drawString(50, y, f"Description: {description}")
            y -= 12

            # TARGET
            target = kpi.get("target", 0)
            unit = kpi.get("unit", "")
            p.drawString(50, y, f"Target: {target} {unit}")
            y -= 12

            # PROGRESS
            progress = kpi.get("progress", 0)
            p.drawString(50, y, f"Overall Progress: {progress}%")
            y -= 18

            # ===== TABLE HEADER =====
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y, "Staff")
            p.drawString(200, y, "Target")
            p.drawString(260, y, "Current")
            p.drawString(330, y, "Progress %")

            y -= 10
            p.line(50, y, 400, y)
            y -= 15

            # ===== TABLE ROWS =====
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

        # ===== FINALIZE =====
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
    
def get_user_name(user_id):
    try:
        users_ref = db.collection("userData")

        query = users_ref.where("userId", "==", user_id).limit(1).stream()

        for doc in query:
            data = doc.to_dict()
            return data.get("name", user_id)

        return user_id  # fallback

    except Exception as e:
        print("USER LOOKUP ERROR:", e)
        return user_id