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

        p.setFont("Helvetica-Bold", 16)
        p.drawString(200, 750, "Weekly KPI Report")

        p.setFont("Helvetica", 12)
        p.drawString(50, 700, f"User: {data.get('user', 'N/A')}")
        p.drawString(50, 680, f"KPI Score: {data.get('score', 'N/A')}")
        p.drawString(50, 660, f"Tasks Completed: {data.get('tasks', 'N/A')}")

        # 🔥 IMPORTANT
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