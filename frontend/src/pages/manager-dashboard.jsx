import { useEffect, useState } from "react";
import PageTitle from "../components/page_title.jsx";
import DashboardCards from "../components/4x1_cards_layout";
import ExportBar from "../components/export-bar";
import RectangleGraphCard from "../components/rectangle_graph_card.jsx";
import StaffRankingCard from "../components/staff_ranking_card.jsx";
import ManagerDashboardKpi from "../components/manager_dashboard_kpi.jsx";
import { fetchManagerKPIs } from "../api/api";
import { useAuth } from "../Auth.jsx";

const API_BASE = "/api";

function ManagerDashboard() {
  const { user } = useAuth();

  const [kpis, setKpis] = useState([]);
  const [atRisk, setAtRisk] = useState([]);
  const [underperform, setUnderperform] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    Promise.all([
      fetchManagerKPIs(),
      fetch(`${API_BASE}/kpi/at-risk`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => res.json()),
      fetch(`${API_BASE}/kpi/underperform`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => res.json()),
      fetch(`${API_BASE}/kpi/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => res.json())
    ])
      .then(([kpiData, atRiskData, underperformData, submissionData]) => {
        setKpis(kpiData.kpis || []);
        setAtRisk(atRiskData.kpis || []);
        setUnderperform(underperformData.kpis || []);
        setSubmissions(submissionData.submissions || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadMonthlyReport = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE}/report/monthly/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = "monthly_report.pdf";

      document.body.appendChild(a);

      a.click();

      a.remove();

      window.URL.revokeObjectURL(url);

    } catch (err) {
      // Handle download errors silently
    }
  };

  const stats = [
    {
      title: "Total KPIs",
      value: loading ? "—" : kpis.length,
      subtitle: "All defined KPIs",
      color: "#3b82f6",
    },
    {
      title: "Active KPIs",
      value:
        loading
          ? "—"
          : kpis.filter(
              (k) => k.status === "active"
            ).length,
      subtitle: "Currently in progress",
      color: "#22c55e",
    },
    {
      title: "Completed",
      value:
        loading
          ? "—"
          : kpis.filter((k) => k.status === "completed").length,
      subtitle: "Finished KPIs",
      color: "#facc15",
    },
    {
      title: "Requires Attention",
      value: loading ? "—" : underperform.length,
      subtitle: "Underperforming KPIs",
      color: "#ef4444",
    },
  ];

  return (
    <div className="d-flex">
      <div
        className="d-flex flex-column"
        style={{
          width: "100%",
          backgroundColor: "#fff",
        }}
      >
        <PageTitle
          title={`Welcome back, ${user?.name || "Manager"}!`}
          subtitle="Here's an overview of your performance tracking dashboard"
        />

        {error && (
          <div
            style={{
              color: "#d93025",
              padding: "10px 20px",
            }}
          >
            Failed to load KPI data: {error}
          </div>
        )}

        <DashboardCards stats={stats} />

        <ExportBar
          onMonthlyReport={handleDownloadMonthlyReport}
        />

        <RectangleGraphCard />

        <div
          className="p-2 d-flex flex-row"
          style={{
            gap: "20px",
            width: "100%",
          }}
        >
          <StaffRankingCard />

          <ManagerDashboardKpi
            kpis={kpis}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;