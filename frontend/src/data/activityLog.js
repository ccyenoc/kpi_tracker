// activityLog.js

export const activityLogs = [
  {
    id: "act_001",
    userId: "user_101",
    actorId: "manager_001",
    kpiId: "kpi_001",
    action: "completed",
    meta: {
      kpiTitle: "Property Viewing Appointments",
      current: 15,
      target: 15
    },
    createdAt: "2026-04-28T10:00:00Z"
  },
  {
    id: "act_002",
    userId: "user_101",
    actorId: "manager_001",
    kpiId: "kpi_002",
    action: "assigned",
    meta: {
      kpiTitle: "Customer Satisfaction KPI",
      current: 85,
      target: 100
    },
    createdAt: "2026-04-27T10:00:00Z"
  }
];

export const getTimeAgo = (dateString) => {
  const now = new Date();
  const past = new Date(dateString);

  const diff = Math.floor((now - past) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "Today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
};