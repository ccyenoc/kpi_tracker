import TopStaffCard from "./top_staff_card";

function StaffRankingCard() {
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
      <TopStaffCard name="John Doe" score={87} rank={1} />
      <TopStaffCard name="Jane Smith" score={85} rank={2} />
      <TopStaffCard name="Alex Tan" score={82} rank={3} />
    </div>
  );
}

export default StaffRankingCard;