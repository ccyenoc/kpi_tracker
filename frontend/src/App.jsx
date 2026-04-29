import { BrowserRouter, Routes, Route } from "react-router-dom";

import SidebarLayout from "./components/SidebarLayout";

// --- MANAGER IMPORTS ---
import ManagerDashboard from "./pages/manager-dashboard"; 
import KpiManagement from "./pages/kpi-management";
import VerifyKPI from "./pages/verify-kpi";
import Login from "./pages/Login";
import RegisterAcc from "./pages/RegisterAcc";
import ProfilePage from "./pages/ProfilePage";
import VerifyKPIDashboard from "./pages/verify-kpi-dashboard";
import CreateKPI from "./pages/create-kpi";
import KPIProgressPage from "./pages/kpi-progress";

// --- STAFF IMPORTS ---
import StaffDashboard from "./pages/staff-dashboard";
import StaffKPIUpdate from "./pages/staff-kpi-progress-update";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<RegisterAcc />} />
        
        <Route path="/" element={<StaffDashboard />} />
        <Route path="/" element={<SidebarLayout><ManagerDashboard /></SidebarLayout>} />
        
        <Route path="/pages/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/pages/staff-kpi-progress-update" element={<StaffKPIUpdate />} />

        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/kpi-management" element={<SidebarLayout><KpiManagement /></SidebarLayout>} />
        <Route path="/verify-kpi" element={<SidebarLayout><VerifyKPI /></SidebarLayout>} />
        <Route path="/verify-kpi-dashboard" element={<SidebarLayout><VerifyKPIDashboard /></SidebarLayout>} />
        <Route path="/create-kpi" element={ <SidebarLayout><CreateKPI /></SidebarLayout>} />
        <Route path="/kpi-progress" element={<SidebarLayout><KPIProgressPage /></SidebarLayout>} />
        
        <Route path="/profile" element={<SidebarLayout><ProfilePage /></SidebarLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
