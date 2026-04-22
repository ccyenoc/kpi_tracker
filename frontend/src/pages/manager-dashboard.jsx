// since that we are using vite we dont need to import react anymore
import ManagerSidebar from "../components/manager_sidebar.jsx";
import DashboardCards from "../components/4x1_cards_layout";
import ExportBar from "../components/export-bar";
import RectangleGraphCard from "../components/rectangle_graph_card.jsx";
import StaffRankingCard from "../components/staff_ranking_card.jsx";
import ManagerDashboardKpi from "../components/manager_dashboard_kpi.jsx";

function ManagerDashboard(){
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
       <DashboardCards 
         title1="Total KPIs"
         value1="3"
         subtitle1="All defined KPIs"
         title2="Active KPIs"
         value2="3"
         subtitle2="Currently in progress"
         title3="Completed"
         value3="1"
         subtitle3="Finished KPIs"
         title4="High Priority"
         value4="2"
         subtitle4="Requires attention"
       />

       <ExportBar />

<div className="p-1"></div>
       <RectangleGraphCard/>
<div 
className="p-2"
style={{
  display: "flex",
  flexDirection: "row",
  gap: "20px",
}}>
   <StaffRankingCard />
   <ManagerDashboardKpi />
</div>
    
</div>

    </div>

  );
}

export default ManagerDashboard;