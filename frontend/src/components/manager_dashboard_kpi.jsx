import KpiCard from "./kpi_card";

function ManagerDashboardKpi() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
      }}
    >
      <div style={{ flex: 1 }}>
        <KpiCard title="At Risk KPIs" />
      </div>

      <div style={{ flex: 1 }}>
        <KpiCard title="Underperform" />
      </div>
    </div>
  );
}

export default ManagerDashboardKpi;