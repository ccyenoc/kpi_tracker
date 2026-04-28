import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StaffDashboard from './pages/staff-dashboard';
import StaffKPIUpdate from './pages/staff-kpi-progress-update';

import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        <Route path="/dashboard" element={<StaffDashboard />} />
        <Route path="/kpi" element={<StaffKPIUpdate />} />
        
        <Route path="*" element={<div className="p-5 text-center"><h1>404 - Page Not Found</h1></div>} />
      </Routes>
    </Router>
  );
}

export default App;