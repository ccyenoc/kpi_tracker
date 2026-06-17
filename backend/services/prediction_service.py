from services.kpi_service import get_staff_kpis
from datetime import datetime

def parse_dt(value, fallback=None):
    """Parse any date value from Firestore into a naive datetime."""
    if value is None:
        return fallback
    if isinstance(value, str):
        # Handle Z-suffix (UTC) which fromisoformat can't parse pre-3.11
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
    kpis_response = get_staff_kpis(request)
    kpis = kpis_response.get("kpis", [])
    predictions = []

    for kpi in kpis:
        assignments = kpi.get("kpiAssignments", [])
        if not assignments:
            continue

        assignment = assignments[0]
        current = assignment.get("current", 0)
        target = assignment.get("target", 1)
        progress = (current / target) * 100 if target > 0 else 0

        predicted = calculate_trajectory_prediction(
            current,
            target,
            kpi.get("createdAt"),
            kpi.get("deadline")
        )

        predictions.append({
            "kpi_id": kpi["id"],
            "kpi_title": kpi["title"],
            "current_progress": round(progress, 2),
            "predicted_progress": round(predicted, 2)
        })

    return {
        "success": True,
        "predictions": predictions
    }


