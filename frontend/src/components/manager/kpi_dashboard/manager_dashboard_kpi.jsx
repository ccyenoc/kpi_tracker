import KpiCard from "./manager_dashboard_kpi/kpi_card";
import { useEffect, useMemo, useState } from "react";
import { kpi } from "../../../api/api";
import { getAtRiskKpis, getUnderperformKpis, getDaysLeft } from "../../../utils/kpiUtils";

function ManagerDashboardKpi({ kpis = [] }) {
  const [atRiskData, setAtRiskData] = useState([]);
  const [underperformData, setUnderperformData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // Fetch at-risk and underperform KPIs from backend
    Promise.all([
      kpi.fetchAtRiskKPIs(),
      kpi.fetchUnderperformKPIs()
    ])
    .then(([atRiskData, underperformData]) => {
      console.log("Fetched at-risk KPIs:", atRiskData);
      console.log("Fetched underperform KPIs:", underperformData);
      setAtRiskData(atRiskData.kpis || []);
      setUnderperformData(underperformData.kpis || []);
    })
    .catch((err) => {
      // Fallback to computing from passed kpis if API fails
      if (kpis.length > 0) {
        setAtRiskData(getAtRiskKpis(kpis));
        setUnderperformData(getUnderperformKpis(kpis));
      }
    })
    .finally(() => setLoading(false));
  }, [kpis]);

  const atRisk = useMemo(() => atRiskData, [atRiskData]);
  const underperform = useMemo(() => underperformData, [underperformData]);

  return (
    <div className="me-2 flex-grow-1"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: "100%",
      }}
    >

      <div style={{ flex: 1, display: "flex" }}>
        <KpiCard
          title="At Risk KPIs"
          subtitle="KPIs that are at risk of not being accomplished on time"
          items={
             atRisk.length === 0 ? []: atRisk.map(kpi => ({
            title: kpi.title,
            subtitle: `${kpi.current || 0} / ${kpi.target} ${kpi.unit}`,
            timeLeft: getDaysLeft(kpi.deadline),
            status: "at_risk",
          }))}
        />
      </div>


      <div style={{ flex: 1, display: "flex" }}>
        <KpiCard
          title="Underperform"
          subtitle="KPIs that are off track to meet their targets"
          items={underperform.map(kpi => ({
            title: kpi.title,
            subtitle: `${kpi.current || 0} / ${kpi.target} ${kpi.unit}`,
            timeLeft: getDaysLeft(kpi.deadline),
            status: "underperform",
          }))}
        />
      </div>
    </div>
  );
}

export default ManagerDashboardKpi;