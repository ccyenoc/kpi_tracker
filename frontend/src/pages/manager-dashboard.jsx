// since that we are using vite we dont need to import react anymore
import ManagerSidebar from "../components/manager_sidebar.jsx";
import DashboardCards from "../components/4x1_cards_layout";
import ExportBar from "../components/export-bar";
import RectangleGraphCard from "../components/rectangle_graph_card.jsx";

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
          <h2>Welcome back, Manager!</h2>
        </div>

      {/*top 4 cards*/}
       <DashboardCards />

       <ExportBar />

<div className="p-1"></div>
       <RectangleGraphCard/>

</div>

    </div>

  );
}

export default ManagerDashboard;