// since that we are using vite we dont need to import react anymore
import ManagerSidebar from "../components/manager_sidebar.jsx";
import DashboardCards from "../components/4x1_cards_layout";
import ExportBar from "../components/export-bar";
import RectangleGraphCard from "../components/rectangle_graph_card.jsx";
import StaffRankingCard from "../components/staff_ranking_card.jsx";
import ManagerDashboardKpi from "../components/manager_dashboard_kpi.jsx";
{/*mock data import*/}
import { kpis } from "../data/kpiData";

function ManagerDashboard(){

  {/*DATA*/}
  {/*DASHBOARD DATA*/}
  const stats = [
  {
    title: "Total KPIs",
    value: kpis.length,
    subtitle: "All defined KPIs",
    color: "#3b82f6"
  },
  {
    title: "Active KPIs",
    value: kpis.filter(k => k.status === "in_progress").length,
    subtitle: "Currently in progress",
    color: "#22c55e"
  },
  {
    title: "Completed",
    value: kpis.filter(k => k.status === "completed").length,
    subtitle: "Finished KPIs",
    color: "#facc15"
  },
  {
    title: "High Priority",
    value: kpis.filter(k => k.priority === "high").length || 0,
    subtitle: "Requires attention",
    color: "#ef4444"
  }
];

   return (
    <div className="d-flex">
      
      {/* Sidebar */}
      <ManagerSidebar />

      <div className="d-flex flex-column" 
        style={{
          marginLeft: "150px",
          width: "100%",
      }}>
      {/* welcome message */}
        <div className="p-4">
          <h2>Welcome back, John!</h2>
        </div>

      {/*top 4 cards*/}
       <DashboardCards stats={stats} />

       <ExportBar />
       <RectangleGraphCard/>
<div 
className="p-2"
style={{
  display: "flex",
  flexDirection: "row",
  gap:"20px"
}}>
   <StaffRankingCard />
   <ManagerDashboardKpi />
</div>
    
</div>

    </div>

  );
}

export default ManagerDashboard;