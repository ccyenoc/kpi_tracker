// pages/verify-kpi-dashboard.jsx
import { useEffect, useState } from "react";
import PageTitle from "../components/page_title";
import DashboardCards from "../components/4x1_cards_layout";
import KPISubmissionTable from "../components/kpi_submission_table";

const API_BASE_URL = "";

function VerifyKPIDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/api/kpi/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch submissions (${res.status})`);
        return res.json();
      })
      .then((data) => setSubmissions(data.submissions || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      title: "Total Submissions",
      value: loading ? "—" : submissions.length,
      subtitle: "All KPI Submissions",
      color: "#3b82f6",
    },
    {
      title: "Pending Verification",
      value: loading ? "—" : submissions.filter((s) => s.status === "pending").length,
      subtitle: "Awaiting Review",
      color: "#facc15",
    },
    {
      title: "Approved",
      value: loading ? "—" : submissions.filter((s) => s.status === "approved").length,
      subtitle: "Successfully Verified",
      color: "#22c55e",
    },
    {
      title: "Rejected",
      value: loading ? "—" : submissions.filter((s) => s.status === "rejected").length,
      subtitle: "Needs Improvement",
      color: "#ef4444",
    },
  ];

  return (
    <div
      className="d-flex"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        className="d-flex"
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <PageTitle
          title="Verify KPI Submissions"
          subtitle="Review and approve staff KPI progress"
        />
      </div>

      {error && (
        <div style={{ color: "#d93025", padding: "10px 20px" }}>
          Failed to load submissions: {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
          Loading submissions…
        </div>
      ) : (
        <>
          <DashboardCards stats={stats} />
          <KPISubmissionTable submissions={submissions} />
        </>
      )}
    </div>
  );
}

export default VerifyKPIDashboard;