import TopStaffCard from "./top_staff_card";
import { rankUsers } from "../utils/performanceUtils";
import { users } from "../data/userData";
import { kpis } from "../data/kpiData";
import { useMemo } from "react";
{/*mock data import*/}
import { submissions } from "../data/submissionData";

function StaffRankingCard() {

  const top3 = useMemo(() => {
  return rankUsers(users, kpis, submissions).slice(0, 3);
  }, [users, kpis, submissions]);

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
      <h4 style={{ fontSize: "18px", textAlign: "left" }}>
        Staff Ranking
      </h4>

      <p style={{ textAlign: "left", fontSize: "14px", color: "#666" }}>
        Top staffs based on KPI performance
      </p>

      <div className="m-2"></div>

      {top3.map((user, index) => (
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