// pages/verify-kpi.jsx
import { useEffect, useState } from "react";
import PageTitle from "../components/page_title";
import DashboardCards from "../components/4x1_cards_layout";
import KPISubmissionTable from "../components/kpi_submission_table";

const API_BASE_URL = "";

function VerifyKPI() {
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmissions = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No authentication token found. Please log in.");
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch all data in parallel
    Promise.all([
      fetch(`${API_BASE_URL}/api/kpi/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        console.log("Submissions response:", res.status);
        return res;
      }),
      fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        console.log("Users response:", res.status);
        return res;
      }),
      fetch(`${API_BASE_URL}/api/manager/kpis`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        console.log("KPIs response:", res.status);
        return res;
      }),
      fetch(`${API_BASE_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        console.log("Categories response:", res.status);
        return res;
      }),
    ])
      .then(async ([submissionsRes, usersRes, kpisRes, categoriesRes]) => {
        if (!submissionsRes.ok) throw new Error(`Failed to fetch submissions (${submissionsRes.status})`);
        if (!usersRes.ok) throw new Error(`Failed to fetch users (${usersRes.status})`);
        if (!kpisRes.ok) throw new Error(`Failed to fetch KPIs (${kpisRes.status})`);
        
        const submissionsData = await submissionsRes.json();
        const usersData = await usersRes.json();
        const kpisData = await kpisRes.json();
        const categoriesData = categoriesRes.ok ? await categoriesRes.json() : { categories: [] };

        console.log("Submissions data:", submissionsData);
        console.log("Submissions count:", submissionsData.submissions?.length || 0);
        console.log("Users data:", usersData);
        console.log("KPIs data:", kpisData);

        // Deduplicate submissions by ID
        const uniqueSubmissions = [];
        const seenIds = new Set();
        
        for (const submission of (submissionsData.submissions || [])) {
          if (!seenIds.has(submission.id)) {
            uniqueSubmissions.push(submission);
            seenIds.add(submission.id);
          }
        }

        console.log("Final submissions after dedup:", uniqueSubmissions);
        setSubmissions(uniqueSubmissions);
        setUsers(usersData.users || []);
        setKpis(kpisData.kpis || []);
        setCategories(categoriesData.categories || []);
      })
      .catch((err) => {
        console.error("Error fetching submissions:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubmissions();
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
      ) : !error && submissions.length === 0 ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
          No submissions found
        </div>
      ) : !error ? (
        <>
          <DashboardCards stats={stats} />
          <KPISubmissionTable 
            submissions={submissions} 
            users={users}
            kpis={kpis}
            categories={categories}
            onSubmissionUpdated={fetchSubmissions}
          />
        </>
      ) : null}
    </div>
  );
}

export default VerifyKPI;