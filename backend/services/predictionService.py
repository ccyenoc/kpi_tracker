# this is a helper file that helps in testing 
# this does not involve in the project logic

from fastapi import Request
from typing import Dict

def get_kpi(kpi_id: str, request: Request):
    pass

def predict_kpi(kpi_id: str, request: Request) -> Dict:
    kpi_response = get_kpi(kpi_id, request)
    if not kpi_response or "kpi" not in kpi_response:
        return {"success": False, "message": "KPI not found"}
    
    kpi = kpi_response["kpi"]
    kpi_assignments = kpi.get("kpiAssignments", [])
    
    if not kpi_assignments:
        return {"success": True, "chart": []}
    
    total_current = sum(a.get("current", 0.0) for a in kpi_assignments)
    total_target = sum(a.get("target", 1.0) for a in kpi_assignments)
    
    chart = []
    for w in range(1, 5):
        week_kpi = (total_target / 4) * w
        week_progress = (total_current / 4) * w
        week_prediction = week_progress * 1.1
        
        chart.append({
            "time": f"Week {w}",
            "kpi": int(week_kpi) if week_kpi % 1 == 0 else round(week_kpi, 2),
            "progress": round(week_progress, 2),
            "prediction": round(week_prediction, 2)
        })
        
    return {
        "success": True,
        "chart": chart
    }
