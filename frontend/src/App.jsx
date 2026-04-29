import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

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
        <Route path="/" element={<Layout><ManagerDashboard /></Layout>} />
        
        <Route path="/staff-dashboard" element={<Layout><StaffDashboard /></Layout>} />
        <Route path="/staff-kpi" element={<Layout><StaffKPIUpdate /></Layout>} />

        <Route path="/manager/dashboard" element={<Layout><ManagerDashboard /></Layout>} />
        <Route path="/kpi-management" element={<Layout><KpiManagement /></Layout>} />
        <Route path="/verify-kpi" element={<Layout><VerifyKPI /></Layout>} />
        <Route path="/verify-kpi-dashboard" element={<Layout><VerifyKPIDashboard /></Layout>} />
        <Route path="/create-kpi" element={ <Layout><CreateKPI /></Layout>} />
        <Route path="/kpi-progress" element={<Layout><KPIProgressPage /></Layout>} />
        
        <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
