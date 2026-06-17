from datetime import datetime
from firebase_admin import firestore
from utils.auth_utils import require_user

def get_db():
    return firestore.client()

def parse_dt(value, fallback=None):
    # convert the firestore date time format into a python format
    if value is None:
        return fallback


    # "2025-06-17T10:30:00Z" -> 2025-06-17T10:30:00+00:00
    if isinstance(value, str):
        normalised = value.replace("Z", "+00:00").replace(".000+00:00", "+00:00")
        try:
            dt = datetime.fromisoformat(normalised)
        except ValueError:
            return fallback
    elif hasattr(value, 'timestamp'):
        dt = datetime.fromtimestamp(value.timestamp())
    else:
        return fallback
    return dt.replace(tzinfo=None) if dt.tzinfo is not None else dt

def calculate_trajectory_prediction(current: float, target: float, created_at_str: str, deadline_str: str) -> float:
    #condition when the current no progress
    if target <= 0:
        return 0.0

    # calculate current progress percentage
    progress = (current / target) * 100

     # get actual time
    now = datetime.now()
    deadline_dt = parse_dt(deadline_str, now)
    created_at_dt = parse_dt(created_at_str, now)

    days_remaining = max((deadline_dt - now).days, 0)
    total_days = max((deadline_dt - created_at_dt).days, 1)
    days_elapsed = max(0, total_days - days_remaining)

    if days_elapsed > 0:
        daily_rate = progress / days_elapsed
        predicted = min(100.0, daily_rate * total_days)
    else:
        predicted = min(100.0, progress * 1.1)

    return predicted

def get_staff_predictions(request):
    from services.kpi_service import get_staff_kpis

    decoded = require_user(request)
    staff_id = (
        decoded.get("user_id")
        or decoded.get("id")
        or decoded.get("uid")
        or decoded.get("sub")
    )

    kpis_response = get_staff_kpis(request)
    kpis = kpis_response.get("kpis", [])

    predictions = []

    for kpi in kpis:
        assignments = kpi.get("kpiAssignments", [])
        if not assignments:
            continue

        assignment = None
        for a in assignments:
            if a.get("userId") == staff_id:
                assignment = a
                break

        if not assignment:
            continue

        current = assignment.get("current", 0)
        target = assignment.get("target", 1)

        if target > 0:
            progress = (current / target) * 100
        else:
            progress = 0

        predicted_progress = calculate_trajectory_prediction(
            current,
            target,
            kpi.get("createdAt"),
            kpi.get("deadline")
        )

        predictions.append({
            "kpi_id": kpi["id"],
            "kpi_title": kpi["title"],
            "current_progress": round(progress, 2),
            "predicted_progress": round(predicted_progress, 2)
        })

    return {
        "success": True,
        "predictions": predictions
    }
