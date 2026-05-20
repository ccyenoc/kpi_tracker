import KpiCard from "./kpi_card";
import { useEffect, useMemo, useState } from "react";
import { getAtRiskKpis, getUnderperformKpis, getDaysLeft } from "../utils/kpiUtils";

function ManagerDashboardKpi({ kpis = [] }) {
  const [atRiskData, setAtRiskData] = useState([]);
  const [underperformData, setUnderperformData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    // Fetch at-risk and underperform KPIs from backend
    Promise.all([
      fetch("/api/kpi/at-risk", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => res.ok ? res.json() : { success: false, kpis: [] }),
      fetch("/api/kpi/underperform", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => res.ok ? res.json() : { success: false, kpis: [] })
    ])
    .then(([atRiskRes, underperformRes]) => {
      setAtRiskData(atRiskRes.kpis || []);
      setUnderperformData(underperformRes.kpis || []);
    })
    .catch((err) => {
      console.error("Failed to fetch KPI status data:", err);
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
     {/* AT RISK */}
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

      {/* UNDERPERFORM */}
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