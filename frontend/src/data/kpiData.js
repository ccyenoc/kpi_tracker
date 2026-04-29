export const kpis = [
  {
    id: "kpi_1",
    title: "Sales Growth",
    description: "Increase monthly sales by 10%",
    unit: "%",
    status: "completed",
    deadline: "2026-06-30",
    categoryId: "cat_1",
    categoryName: "Sales Performance",
    assignedUserIds: ["user_101", "user_102"],
    kpiAssignments: [
      { userId: "user_101", target: 50, current: 30 },
      { userId: "user_102", target: 50, current: 37 }
    ],
    createdBy: "user_manager",
    updatedAt: "2026-04-10"
  },
  {
    id: "kpi_2",
    title: "Customer Satisfaction",
    description: "Maintain high customer satisfaction ratings",
    unit: "%",
    status: "in_progress",
    deadline: "2026-07-15",
    categoryId: "cat_2",
    categoryName: "Lead Generation",
    assignedUserIds: ["user_101"],
    kpiAssignments: [
      { userId: "user_101", target: 90, current: 68 }
    ],
    createdBy: "user_manager",
    updatedAt: "recently"
  },
  {
    id: "kpi_3",
    title: "Product Launch Timeline",
    description: "Launch new product line within timeline",
    unit: "%",
    status: "at_risk",
    deadline: "2026-05-20",
    categoryId: "cat_3",
    categoryName: "Project",
    assignedUserIds: ["user_101"],
    kpiAssignments: [
      { userId: "user_101", target: 100, current: 45 }
    ],
    createdBy: "user_manager",
    updatedAt: "2026-04-28"
  },
  {
    id: "kpi_4",
    title: "Employee Training",
    description: "Complete required technical training hours",
    unit: "hours",
    status: "in_progress",
    deadline: "2026-12-31",
    categoryId: "cat_4",
    categoryName: "Development",
    assignedUserIds: ["user_101"],
    kpiAssignments: [
      { userId: "user_101", target: 40, current: 12 }
    ],
    createdBy: "user_manager",
    updatedAt: "2026-04-15"
  }
];