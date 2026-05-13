import { useEffect, useState } from "react";
import PageTitle from "../components/page_title.jsx";
import DashboardCards from "../components/4x1_cards_layout";
import ExportBar from "../components/export-bar";
import RectangleGraphCard from "../components/rectangle_graph_card.jsx";
import StaffRankingCard from "../components/staff_ranking_card.jsx";
import ManagerDashboardKpi from "../components/manager_dashboard_kpi.jsx";
import { fetchManagerKPIs } from "../api/api";
import { useAuth } from "../Auth.jsx";

const API_BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:8006" : "";

/**
 * ManagerDashboard (Manager Module — Live Firebase Data)
 *
 * Data sources:
 *  - KPI stats cards      → GET /api/manager/kpi           (fetchManagerKPIs)
 *  - Monthly perf graph   → GET /api/manager/dashboard/monthly-performance
 *  - Staff rankings       → fetched inside StaffRankingCard (GET /api/manager/dashboard/stats)
 *  - KPI list (right col) → passed as prop to ManagerDashboardKpi
 */
function ManagerDashboard() {
  const { user } = useAuth();

  // ── KPI stats for top 4 cards ──────────────────────────────────────────────
  const [kpis, setKpis] = useState([]);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState(null);

  // ── Monthly performance graph data ────────────────────────────────────────
  const [graphData, setGraphData] = useState([]);
  const [graphLoading, setGraphLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("All");

  useEffect(() => {
    // 1. Fetch KPI list for stats cards + right column
    fetchManagerKPIs()
      .then((data) => setKpis(data.kpis || []))
      .catch((err) => setKpisError(err.message))
      .finally(() => setKpisLoading(false));

    // 2. Fetch monthly performance data for the graph
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/api/manager/dashboard/monthly-performance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Monthly performance fetch failed (${res.status})`);
        return res.json();
      })
      .then((data) => setGraphData(data.monthlyPerformance || []))
      .catch(() => setGraphData([]))   // silent fail — graph shows empty state
      .finally(() => setGraphLoading(false));
  }, []);

  const stats = [
    {
      title: "Total KPIs",
      value: kpisLoading ? "—" : kpis.length,
      subtitle: "All defined KPIs",
      color: "#3b82f6",
    },
    {
      title: "Active KPIs",
      value: kpisLoading
        ? "—"
        : kpis.filter((k) => k.status === "active" || k.status === "in_progress").length,
      subtitle: "Currently in progress",
      color: "#22c55e",
    },
    {
      title: "Completed",
      value: kpisLoading ? "—" : kpis.filter((k) => k.status === "completed").length,
      subtitle: "Finished KPIs",
      color: "#facc15",
    },
    {
      title: "High Priority",
      value: kpisLoading ? "—" : kpis.filter((k) => k.priority === "high").length,
      subtitle: "Requires attention",
      color: "#ef4444",
    },
  ];

  return (
    <div className="d-flex">
      <div
        className="d-flex flex-column"
        style={{ width: "100%", backgroundColor: "#fff" }}
      >
        <PageTitle
          title={`Welcome back, ${user?.name || "Manager"}!`}
          subtitle="Here's an overview of your performance tracking dashboard"
        />

        {kpisError && (
          <div style={{ color: "#d93025", padding: "10px 20px" }}>
            Failed to load KPI data: {kpisError}
          </div>
        )}

        <DashboardCards stats={stats} />
        <ExportBar />

        {/* Monthly performance graph — receives live data from Firebase */}
        <RectangleGraphCard
          graphData={graphData}
          graphLoading={graphLoading}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
        />

        <div
          className="p-2 d-flex flex-row"
          style={{ gap: "20px", width: "100%" }}
        >
          {/* StaffRankingCard fetches its own data internally */}
          <StaffRankingCard />

          {/* Pass live kpis down so ManagerDashboardKpi can consume them */}
          <ManagerDashboardKpi kpis={kpis} loading={kpisLoading} />
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
ENDOFFILE
