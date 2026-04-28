import { BrowserRouter, Routes, Route } from "react-router-dom";
import StaffDashboard from "./staff/staff-dashboard";
import StaffKPIUpdate from "./staff/staff-kpi-progress-update";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StaffDashboard />} />
        <Route path="/kpi" element={<StaffKPIUpdate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;