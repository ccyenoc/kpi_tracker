export const kpis = [
  {
    id: "kpi_1",
    title: "Sales Growth",
    description: "Increase monthly sales by 10%",

    target: 100,
    current: 67,
    unit: "%",

    categoryId: "cat_1",
    deadline: "2026-06-30",
    status: "completed",

    assignedUserIds: ["user_101", "user_102"],

    kpiAssignments: [
      {
        userId: "user_101",
        target: 50,
        current: 30
      },
      {
        userId: "user_102",
        target: 50,
        current: 37
      }
    ],

    createdBy: "user_manager"
  }
];