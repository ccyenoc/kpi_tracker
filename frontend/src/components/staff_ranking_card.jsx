import TopStaffCard from "./top_staff_card";
// import mock data
import { users } from "../data/userData";
import { kpis } from "../data/kpiData";
import { useMemo } from "react";

function StaffRankingCard() {

  const staffRanking = () => {
    const ranking = users
      .filter(u => u.role === "staff")
      .map(user => {

        // get KPIs assigned to this user
        const userKpis = kpis.filter(kpi =>
          kpi.assignedUserIds.includes(user.id)
        );

        const scores = userKpis.map(kpi => {
          if (kpi.target === 0) return 0;
          return (kpi.current / kpi.target) * 100;
        });

        const avgScore =
          scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        return {
          id: user.id,
          name: user.name,
          score: Math.round(avgScore)
        };
      });

    return ranking.sort((a, b) => b.score - a.score);
  };

  const top3 = useMemo(() => {
  return staffRanking().slice(0, 3);
}, []);

  return (

    <div className="ms-2"
      style={{
        width: "40%",
        backgroundColor: "#ffffff",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        
      }}>
      <h4
       style={{
        fontSize: "18px",
        textAlign: "left",
       }}>Staff Ranking</h4>
      <p style={{ 
        textAlign: "left",
        fontSize : "14px",
        color: "#666" 
        }}>
        Top staffs based on KPI performance
      </p>

      <div className="m-2"></div>
      {top3.map((user, index) => (
       <TopStaffCard
       key={user.id}
       name={user.name}
       score={user.score}
       rank={index + 1}
  />
))}
    </div>
  );
}

export default StaffRankingCard;