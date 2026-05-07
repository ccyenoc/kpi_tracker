// Get KPIs that are at risk (near deadline + not completed)
export function getAtRiskKpis(kpis) {
  const today = new Date();

  return (kpis || []).filter(kpi => {
    const deadline = new Date(kpi.deadline);
    const daysLeft = (deadline - today) / (1000 * 60 * 60 * 24);

    return (
      kpi.current < kpi.target &&   // not completed
      daysLeft <= 3                 // threshold (you can tweak)
    );
  });
}


// Get KPIs that are underperforming
export function getUnderperformKpis(kpis) {
  return (kpis || []).filter(kpi => {
    if (kpi.target === 0) return false;

    const progress = (kpi.current / kpi.target) * 100;
    return progress < 50; // threshold
  });
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