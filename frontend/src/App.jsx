import { BrowserRouter, Routes, Route } from "react-router-dom";

import ManagerLayout from "./components/SidebarLayout";

import Dashboard from "./pages/manager-dashboard";
import KpiManagement from "./pages/kpi-management";
import VerifyKPI from "./pages/verify-kpi";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SidebarLayout><Dashboard /></SidebarLayout>} />
        <Route path="/kpi-management" element={<SidebarLayout><KpiManagement /></SidebarLayout>} />
        <Route path="/verify-kpi" element={<SidebarLayout><VerifyKPI /></SidebarLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;