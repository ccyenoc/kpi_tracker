from services.kpi_service import get_kpi


def predict_kpi( kpi_id, request ):

    response = get_kpi( kpi_id, request )

    kpi = response["kpi"]

    assignments = kpi.get( "kpiAssignments",[] )

    if not assignments:

        return {
            "success": True,
            "chart": []
        }

    assignment = assignments[0]
    current = assignment.get( "current", 0 )
    target = assignment.get( "target", 1 )
    progress = ( current / target ) * 100
    prediction = min( progress * 1.1, 100 )


    chart = [

        {
            "time": "Week 1",
            "kpi": 25,
            "progress": progress * 0.25,
            "prediction": prediction * 0.25
        },

        {
            "time": "Week 2",
            "kpi": 50,
            "progress": progress * 0.5,
            "prediction": prediction * 0.5
        },

        {
            "time": "Week 3",
            "kpi": 75,
            "progress": progress * 0.75,
            "prediction": prediction * 0.75
        },

        {
            "time": "Week 4",
            "kpi": 100,
            "progress": progress,
            "prediction": prediction
        }

    ]

    return {
        "success": True,
        "chart": chart
    }