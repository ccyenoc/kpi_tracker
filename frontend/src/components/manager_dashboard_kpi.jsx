import KpiCard from "./kpi_card";

function ManagerDashboardKpi() {
  return (
    <div className="me-2"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
        flexGrow: 1,
      }}
    >
      <div style={{ flex: 1, display: "flex" }}>
        <KpiCard
          title="At Risk KPIs"
          subtitle="KPIs that are at risk of not being accomplished on time"
          items={[
            {
              title: "Property Sales Target",
              subtitle: "2 / 20 units sold",
              timeLeft: "1 day left",
              status: "risk",
            },
          ]}
        />
      </div>

      <div style={{ flex: 1, display: "flex" }}>
        <KpiCard
          title="Underperform"
          subtitle="KPIs that are off track to meet their targets"
          items={[
            {
              title: "Customer Retention",
              subtitle: "40% retention",
              timeLeft: "Overdue",
              status: "underperform",
            },
          ]}
        />
      </div>
    </div>
  );
}

export default ManagerDashboardKpi;