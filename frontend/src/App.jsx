import { BrowserRouter, Routes, Route } from "react-router-dom";
// --- USER IMPORTS ---
import Login from "./pages/Login";
import RegisterAcc from "./pages/RegisterAcc"
import ProfilePage from "./pages/ProfilePage"
import SecurityPage from "./pages/SecurityPage"

// --- MANAGER IMPORTS ---
import ManagerDashboard from "./pages/manager-dashboard"; 
import KpiManagement from "./pages/kpi-management";
import VerifyKPI from "./pages/verify-kpi";
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
        {/* CAN SET TO SPECIFIC PAGES ACCORDINGLY */}
        <Route path="/" element={<Login />} />
        
        {/* staff Routes */}
        <Route path="/pages/staff-dashboard" element={<StaffDashboard />} />
        <Route path="/staff-kpi-progress-update" element={<StaffKPIUpdate />} />

        {/* manager Routes */}
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/kpi-management" element={<KpiManagement />} />
        <Route path="/verify-kpi" element={<VerifyKPI />} />
        <Route path="/verify-kpi-dashboard" element={<VerifyKPIDashboard />} />
        <Route path="/create-kpi" element={<CreateKPI />} />
        <Route path="/kpi-progress" element={<KPIProgressPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
