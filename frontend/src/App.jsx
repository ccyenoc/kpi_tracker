import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/manager-dashboard";
import KpiManagement from "./pages/kpi-management";
import VerifyKPI from "./pages/verify-kpi";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/kpi-management" element={<KpiManagement />} />
        <Route path="/verify-kpi" element={<VerifyKPI />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;