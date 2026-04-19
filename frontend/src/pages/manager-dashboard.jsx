// since that we are using vite we dont need to import react anymore
import ManagerSidebar from "../components/manager_sidebar.jsx";
import DashboardCards from "../components/4x1_cards_layout";

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

</div>

    </div>

  );
}

export default ManagerDashboard;