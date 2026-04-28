import React, { useState } from 'react';
import Sidebar from '../components/staff-sidebar';
import Header from '../components/staff-header';
import { 
  AlertTriangle, 
  Clock, 
  Info, 
  Search, 
  CheckCircle, 
  ChevronDown 
} from 'lucide-react';

const StaffDashboard = () => {
  const [performanceFilter, setPerformanceFilter] = useState('overall');
  const [kpiStatus, setKpiStatus] = useState('All');

  return (
    <div className="d-flex align-items-stretch min-vh-100 w-100" style={{ backgroundColor: '#F8FAFC' }}>
      <Sidebar activePage="dashboard" />
      
      <div className="d-flex flex-column flex-grow-1 w-100 overflow-hidden">
        <Header title="Dashboard" />
        
        <main className="p-4 flex-grow-1 w-100 overflow-x-hidden" style={{ maxWidth: '100%' }}>
          <div className="mb-4">
            <h2 className="fw-bold text-dark mb-1">Welcome back, Jane !</h2>
            <p className="text-muted">Here's an overview of your performance tracking dashboard</p>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-xl-3 col-md-6">
              <div className="card h-100 border-0 border-start border-4 shadow-sm p-3" style={{ borderLeftColor: '#155DFC' }}>
                <div className="d-flex justify-content-between align-items-start">
                  <h6 className="text-muted small fw-bold">Total KPIs</h6>
                  <Info size={16} className="text-primary" />
                </div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <h2 className="fw-bold m-0">15</h2>
                  <span className="badge bg-light text-muted border">+1</span>
                </div>
                <div className="p-2 rounded d-flex align-items-center gap-2" style={{ backgroundColor: '#FAF5FF', border: '1px solid #E9D4FF' }}>
                   <div className="text-white rounded-circle p-1 d-flex" style={{ backgroundColor: '#AD46FF' }}>
                     <Clock size={10} />
                   </div>
                   <div style={{ fontSize: '10px' }}>
                     <div className="fw-bold text-dark">Customer Satisfaction KPI</div>
                     <div className="text-muted">31 days left</div>
                   </div>
                   <span className="badge ms-auto py-1 px-2" style={{ backgroundColor: '#E1F0FF', color: '#1447E6', fontSize: '9px' }}>New</span>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="card h-100 border-0 border-start border-4 shadow-sm p-3" style={{ borderLeftColor: '#00A63E' }}>
                <h6 className="text-muted small fw-bold">Completion Rate</h6>
                <h2 className="fw-bold mb-1">67%</h2>
                <p className="small text-muted mb-2">8 of 12 completed</p>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: '67%', backgroundColor: '#2563EB' }}></div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="card h-100 border-0 border-start border-4 shadow-sm p-3" style={{ borderLeftColor: '#F59E0B' }}>
                <h6 className="text-muted small fw-bold">At Risk</h6>
                <h2 className="fw-bold mb-1">20%</h2>
                <p className="small text-muted mb-2">4 tasks are at risk !</p>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: '20%', backgroundColor: '#2563EB' }}></div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6">
              <div className="card h-100 border-0 border-start border-4 shadow-sm p-3" style={{ borderLeftColor: '#F54900' }}>
                <h6 className="text-muted small fw-bold">Underperform</h6>
                <h2 className="fw-bold mb-1">0%</h2>
                <p className="small text-muted mb-2">No unfulfilled KPI</p>
                <div className="progress" style={{ height: '6px' }}>
                  <div className="progress-bar" style={{ width: '0%', backgroundColor: '#2563EB' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* FIXED: Removed m-0 and w-100 to allow horizontal stretching */}
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div>
                    <h6 className="fw-bold m-0">Monthly Performance</h6>
                    <p className="small text-muted">KPI completion vs target over time</p>
                  </div>
                  <select 
                    className="form-select form-select-sm w-auto border-secondary-subtle"
                    value={performanceFilter}
                    onChange={(e) => setPerformanceFilter(e.target.value)}
                  >
                    <option value="overall">Overall Performance</option>
                    <option value="search">Search specific KPI...</option>
                  </select>
                </div>
                
                <div className="d-flex flex-column justify-content-center align-items-center flex-grow-1" style={{ minHeight: '300px' }}>
                   {performanceFilter === 'search' ? (
                     <div className="w-75">
                        <div className="input-group input-group-sm mb-3">
                          <span className="input-group-text bg-white border-end-0"><Search size={14}/></span>
                          <input type="text" className="form-control border-start-0" placeholder="Type KPI task name..." />
                        </div>
                     </div>
                   ) : (
                     <p className="text-muted small">Chart rendering for: Total KPI completion over time</p>
                   )}
                </div>

                <div className="d-flex justify-content-center gap-4 mt-3 small fw-medium">
                  <span style={{ color: '#2563EB' }}>▬ Progress</span>
                  <span style={{ color: '#EAB308' }}>▬ Target</span>
                  <span style={{ color: '#8B5CF6' }}>▬ Predicted</span>
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card border-0 shadow-sm p-4 h-100">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h6 className="fw-bold m-0">KPI Assigned</h6>
                    <p className="small text-muted">KPIs Assigned are shown below</p>
                  </div>
                  <select 
                    className="form-select form-select-sm w-auto border-secondary-subtle"
                    value={kpiStatus}
                    onChange={(e) => setKpiStatus(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending Verification</option>
                    <option value="Verified">Verified</option>
                    <option value="At Risk">At Risk</option>
                    <option value="Underperform">Underperform</option>
                  </select>
                </div>

                <div className="d-flex flex-column gap-2">
                  {[
                    { title: "Property Sales Target", detail: "2 / 20 units sold", date: "1 day left" },
                    { title: "Lead Conversion Rate", detail: "15 / 20 deals closed (75%)", date: "4 days left" },
                    { title: "New Property Listings", detail: "1 / 10 units (1%)", date: "7 days left" }
                  ].map((kpi, index) => (
                    <div key={index} className="p-3 rounded border border-warning-subtle" style={{ backgroundColor: '#FFFBEB' }}>
                      <div className="d-flex justify-content-between mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-warning rounded-circle p-1 d-flex"><AlertTriangle size={12} className="text-white"/></div>
                          <span className="fw-bold small">{kpi.title}</span>
                        </div>
                        <span className="badge py-1 px-2" style={{ backgroundColor: '#F59E0B', fontSize: '9px' }}>At Risk</span>
                      </div>
                      <p className="text-muted mb-1" style={{ fontSize: '11px' }}>{kpi.detail}</p>
                      <div className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '10px' }}>
                        <Clock size={10} /> {kpi.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h6 className="fw-bold mb-1">Recent Activity</h6>
            <p className="small text-muted mb-3">Latest Update</p>
            <div className="card border-0 shadow-sm p-4 mb-4">
              <div className="p-3 rounded border-0 d-flex align-items-center gap-3" style={{ backgroundColor: '#F0FDF4' }}>
                <div className="bg-success text-white rounded-circle p-2 d-flex"><CheckCircle size={18}/></div>
                <div>
                  <div className="fw-bold small">Verified KPI - Property Viewing Appointments</div>
                  <div className="text-muted small">Scheduled Viewings - 15/15 completed (100%)</div>
                  <div className="text-muted mt-1" style={{ fontSize: '10px' }}><Clock size={10} className="me-1" /> 1 days ago</div>
                </div>
                <span className="badge bg-success ms-auto py-1 px-3">Verified</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;