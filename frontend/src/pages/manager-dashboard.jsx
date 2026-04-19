// since that we are using vite we dont need to import react anymore
import ManagerSidebar from "../components/manager_sidebar.jsx";

function ManagerDashboard(){
   return (
    <div className="d-flex">
      
      {/* Sidebar */}
      <ManagerSidebar />

      {/* Main Content */}
      <div style={{ marginLeft: "250px", width: "100%" , border:"none"}}>
        <div className="p-4">
          <h2>Welcome back, Manager!</h2>
        </div>
      </div>

    </div>
  );
}

export default ManagerDashboard;