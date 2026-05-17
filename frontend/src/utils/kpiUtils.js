// Get KPIs that are at risk (near deadline + not completed)
export function getAtRiskKpis(kpis) {
  return (kpis || []).filter(kpi => kpi.status === "at_risk");
}


// Get KPIs that are underperforming
export function getUnderperformKpis(kpis) {
  return (kpis || []).filter(kpi => kpi.status === "underperform");
}


// Helper: calculate days left
export function getDaysLeft(deadline) {
  const today = new Date();
  const end = new Date(deadline);

  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "Overdue";
  if (diff === 0) return "Due today";

  return `${diff} day${diff > 1 ? "s" : ""} left`;
}