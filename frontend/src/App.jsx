import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import { pathway } from "./pages/Pathway";

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
        <Route path={pathway.Login} element={<Login />} />
        <Route path={pathway.RegisterAcc} element={<RegisterAcc />} />
        
        <Route path={pathway.StaffDashboard} element={<StaffDashboard />} />
        <Route path={pathway.ManagerDashboard} element={<Layout><ManagerDashboard /></Layout>} />
        
        <Route path={pathway.StaffKPIUpdate} element={<Layout><StaffKPIUpdate /></Layout>} />

        <Route path={pathway.KpiManagement} element={<Layout><KpiManagement /></Layout>} />
        <Route path={pathway.VerifyKPI} element={<Layout><VerifyKPI /></Layout>} />
        <Route path={pathway.VerifyKPIDashboard} element={<Layout><VerifyKPIDashboard /></Layout>} />
        <Route path={pathway.CreateKPI} element={ <Layout><CreateKPI /></Layout>} />
        <Route path={pathway.KPIProgressPage} element={<Layout><KPIProgressPage /></Layout>} />
        
        <Route path={pathway.ProfilePage} element={<Layout><ProfilePage /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
