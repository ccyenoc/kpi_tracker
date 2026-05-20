from datetime import datetime


def predict_kpi(
    kpi_id: str,
    request
):

    kpi = get_kpi(
        kpi_id,
        request
    )

    assignment = (
        kpi["kpiAssignments"][0]
    )

    current = assignment["current"]
    target = assignment["target"]

    completion = (
        current / target
    ) * 100

    due = datetime.fromisoformat(
        kpi["deadline"]
    )

    today = datetime.now()

    days_left = (
        due - today
    ).days

    if completion >= 100:
        status = "Completed"

    elif completion >= 70:
        status = "On Track"

    else:
        status = "At Risk"

    return {
        "completion": round(
            completion,
            1
        ),
        "daysLeft": days_left,
        "status": status
    }