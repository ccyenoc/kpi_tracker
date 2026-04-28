import { BrowserRouter, Routes, Route } from "react-router-dom";

import SidebarLayout from "./components/SidebarLayout";

import Dashboard from "./pages/manager-dashboard";
import KpiManagement from "./pages/kpi-management";
import VerifyKPI from "./pages/verify-kpi";
import Login from "./pages/Login";
import RegisterAcc from "./pages/RegisterAcc";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<RegisterAcc />} />
        
        <Route path="/" element={<SidebarLayout><Dashboard /></SidebarLayout>} />
        <Route path="/kpi-management" element={<SidebarLayout><KpiManagement /></SidebarLayout>} />
        <Route path="/verify-kpi" element={<SidebarLayout><VerifyKPI /></SidebarLayout>} />
        <Route path="/profile" element={<SidebarLayout><ProfilePage /></SidebarLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;