from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io

from services.kpi_service import get_weekly_kpi

router = APIRouter()

@router.get("/api/report/weekly")
def weekly_report():
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)

    data = get_weekly_kpi()

    p.setFont("Helvetica-Bold", 16)
    p.drawString(200, 750, "Weekly KPI Report")

    p.setFont("Helvetica", 12)
    p.drawString(50, 700, f"User: {data['user']}")
    p.drawString(50, 680, f"KPI Score: {data['score']}")
    p.drawString(50, 660, f"Tasks Completed: {data['tasks']}")

    p.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=weekly_report.pdf"}
    )