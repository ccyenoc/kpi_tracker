import KpiCard from "./kpi_card";
import { useMemo } from "react";
import { getAtRiskKpis, getUnderperformKpis, getDaysLeft } from "../utils/kpiUtils";
import { kpis } from "../data/kpiData";

function ManagerDashboardKpi() {

  const atRisk = useMemo(() => getAtRiskKpis(kpis), [kpis]);
  const underperform = useMemo(() => getUnderperformKpis(kpis), [kpis]);

  return (
    <div className="me-2 flex-grow-1"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
      }}
    >
     {/* AT RISK */}
      <div style={{ flex: 1, display: "flex" }}>
        <KpiCard
          title="At Risk KPIs"
          subtitle="KPIs that are at risk of not being accomplished on time"
          items={
             atRisk.length === 0 ? []: atRisk.map(kpi => ({
            title: kpi.title,
            subtitle: `${kpi.current} / ${kpi.target} ${kpi.unit}`,
            timeLeft: getDaysLeft(kpi.deadline),
            status: "risk",
          }))}
        />
      </div>

      {/* UNDERPERFORM */}
      <div style={{ flex: 1, display: "flex" }}>
        <KpiCard
          title="Underperform"
          subtitle="KPIs that are off track to meet their targets"
          items={underperform.map(kpi => ({
            title: kpi.title,
            subtitle: `${kpi.current} / ${kpi.target} ${kpi.unit}`,
            timeLeft: getDaysLeft(kpi.deadline),
            status: "underperform",
          }))}
        />
      </div>
    </div>
  );
}

export default ManagerDashboardKpi;