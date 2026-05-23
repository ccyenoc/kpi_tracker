import { useEffect, useState } from "react";
import TopStaffCard from "./top_staff_card";

const API_BASE_URL = "";

/**
 * StaffRankingCard (Manager Module — Live Firebase Data)
 *
 * Fetches real staff performance rankings from the backend aggregation endpoint
 * GET /api/manager/dashboard/stats and renders the top-3 performers.
 *
 * Shape returned by the endpoint per staff entry:
 *   { staffId, name, department, totalTarget, totalCurrent, kpiCount, achievementRate }
 *
 * We derive the three sub-scores that TopStaffCard expects as follows:
 *   - kpiScore        → achievementRate (overall %
 *   - timelinessScore → placeholder derived from achievementRate (backend doesn't store
 *                       timeliness separately yet; extend when that data is available)
 *   - qualityScore    → same placeholder strategy
 *   - finalScore      → achievementRate (used for the circular progress ring)
 */
function StaffRankingCard() {
  const [top3, setTop3] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API_BASE_URL}/api/manager/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to fetch staff rankings (${res.status})`);
        return res.json();
      })
      .then((data) => {
        // staffRankings is already sorted by achievementRate desc (top 10)
        const rankings = (data.staffRankings || []).slice(0, 3);

        // Map backend shape → TopStaffCard props
        const mapped = rankings.map((s) => ({
          id: s.staffId,
          name: s.name,
          // KPI completion = overall achievement rate
          kpiScore: Math.min(100, Math.round(s.achievementRate)),
          // Timeliness & quality are not stored separately yet — use achievement rate
          // as a proportional proxy until the backend exposes those fields.
          timelinessScore: Math.min(100, Math.round(s.achievementRate * 0.95)),
          qualityScore: Math.min(100, Math.round(s.achievementRate * 0.9)),
          finalScore: Math.min(100, Math.round(s.achievementRate)),
        }));

        setTop3(mapped);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="ms-2 flex-grow-1"
      style={{
        backgroundColor: "#ffffff",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <h4 style={{ fontSize: "18px", textAlign: "left" }}>Staff Ranking</h4>
      <p style={{ textAlign: "left", fontSize: "14px", color: "#666" }}>
        Top staffs based on KPI performance
      </p>

      <div className="m-2" />

      {loading && (
        <p style={{ color: "#888", fontSize: "14px", textAlign: "center", padding: "20px" }}>
          Loading rankings…
        </p>
      )}

      {error && (
        <p style={{ color: "#d93025", fontSize: "13px", padding: "10px" }}>
          Failed to load rankings: {error}
        </p>
      )}

      {!loading && !error && top3.length === 0 && (
        <p style={{ color: "#aaa", fontSize: "13px", textAlign: "center", padding: "20px" }}>
          No staff performance data yet.
        </p>
      )}

      {!loading &&
        top3.map((user, index) => (
          <TopStaffCard
            key={user.id}
            name={user.name}
            kpi={user.kpiScore}
            timeliness={user.timelinessScore}
            quality={user.qualityScore}
            performance={user.finalScore}
            rank={index + 1}
          />
        ))}
    </div>
  );
}

export default StaffRankingCard;