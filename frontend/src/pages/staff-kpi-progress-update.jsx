import React, { useState } from 'react';
import Sidebar from '../components/staff-sidebar';
import Header from '../components/staff-header';
import { 
  Target, 
  CheckCircle, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  FileText, 
  UploadCloud, 
  X 
} from 'lucide-react';

const StaffKPIUpdate = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);

  const kpis = [
    { id: 1, title: 'Q1 Sales Target', desc: 'Achieve quarterly sales revenue target', progress: 525000, target: 500000, unit: 'USD', status: 'completed', deadline: 'Overdue', evidence: '2 files', category: 'Revenue', lastUpdate: '3/28/2026' },
    { id: 2, title: 'Customer Satisfaction Score', desc: 'Maintain high customer satisfaction ratings', progress: 68, target: 90, unit: '%', status: 'on-track', deadline: '84 days', evidence: '1 files', category: 'Quality', lastUpdate: '4/1/2026' },
    { id: 3, title: 'Product Launch Timeline', desc: 'Launch new product line within timeline', progress: 45, target: 100, unit: '%', status: 'at-risk', deadline: '38 days', evidence: '1 files', category: 'Project', lastUpdate: '4/3/2026' },
    { id: 4, title: 'Employee Training Hours', desc: 'Complete required training hours', progress: 12, target: 40, unit: 'hours', status: 'on-track', deadline: '268 days', evidence: '1 files', category: 'Development', lastUpdate: '3/30/2026' },
  ];

  const handleUpdateClick = (kpi) => {
    setSelectedKPI(kpi);
    setShowModal(true);
  };

  return (
    <div className="d-flex align-items-stretch min-vh-100 w-100" style={{ backgroundColor: '#F8FAFC' }}>
      <Sidebar activePage="kpi" />
      
      <div className="d-flex flex-column flex-grow-1">
        <Header title="My KPIs" />
        
        <main className="p-4 flex-grow-1">
          <div className="mb-4">
            <h2 className="fw-bold text-dark mb-1">My KPIs</h2>
            <p className="text-muted">Track and update your key performance indicators</p>
          </div>

          {/* KPI Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 text-primary">
                  <span className="small fw-bold text-muted">Total KPIs</span>
                  <Target size={18} />
                </div>
                <h3 className="fw-bold m-0">4</h3>
                <p className="small text-muted m-0">Assigned to you</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 text-success">
                  <span className="small fw-bold text-muted">Completed</span>
                  <CheckCircle size={18} />
                </div>
                <h3 className="fw-bold m-0">1</h3>
                <p className="small text-muted m-0">Targets achieved</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 text-primary">
                  <span className="small fw-bold text-muted">On Track</span>
                  <TrendingUp size={18} />
                </div>
                <h3 className="fw-bold m-0">2</h3>
                <p className="small text-muted m-0">Progressing well</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm p-3 h-100">
                <div className="d-flex justify-content-between align-items-center mb-3 text-warning">
                  <span className="small fw-bold text-muted">Needs Attention</span>
                  <AlertCircle size={18} />
                </div>
                <h3 className="fw-bold m-0">1</h3>
                <p className="small text-muted m-0">Behind schedule</p>
              </div>
            </div>
          </div>

          {/* Overall Progress Section */}
          <div className="card border-0 shadow-sm p-4 mb-4">
            <h6 className="fw-bold m-0">Overall Progress</h6>
            <p className="small text-muted mb-3">Your average KPI completion rate</p>
            <div className="d-flex justify-content-between mb-1 small fw-bold">
              <span>Total Achievement</span>
              <span>62.6%</span>
            </div>
            <div className="progress mb-2" style={{ height: '10px' }}>
              <div className="progress-bar bg-primary" style={{ width: '62.6%' }}></div>
            </div>
            <p className="small text-muted m-0">1 of 4 KPIs completed</p>
          </div>

          {/* KPI Cards Grid */}
          <div className="row g-4">
            {kpis.map((kpi) => (
              <div className="col-md-6" key={kpi.id}>
                <div className="card border-0 shadow-sm h-100 p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      {kpi.status === 'on-track' ? <TrendingUp size={18} className="text-primary" /> : 
                       kpi.status === 'completed' ? <CheckCircle size={18} className="text-success" /> : 
                       <AlertCircle size={18} className="text-warning" />}
                      <h5 className="fw-bold m-0">{kpi.title}</h5>
                    </div>
                    <span className={`badge px-2 py-1 ${kpi.status === 'completed' ? 'bg-success-subtle text-success' : kpi.status === 'at-risk' ? 'bg-warning-subtle text-warning' : 'bg-primary-subtle text-primary'}`} style={{ fontSize: '10px' }}>
                      {kpi.status}
                    </span>
                  </div>
                  <p className="small text-muted mb-4">{kpi.desc}</p>
                  
                  <div className="d-flex justify-content-between mb-1 small fw-bold">
                    <span>Progress</span>
                    <span>{kpi.progress.toLocaleString()} / {kpi.target.toLocaleString()} {kpi.unit}</span>
                  </div>
                  <div className="progress mb-2" style={{ height: '8px' }}>
                    <div className="progress-bar" style={{ width: `${Math.min((kpi.progress/kpi.target)*100, 100)}%` }}></div>
                  </div>
                  <p className="small text-muted mb-4">{(kpi.progress/kpi.target*100).toFixed(1)}% complete</p>

                  <div className="row g-2 mb-4">
                    <div className="col-6">
                      <div className="d-flex align-items-center gap-2 text-muted small">
                        <Clock size={14} /> 
                        <div>
                          <div className="fw-bold" style={{ fontSize: '10px' }}>Deadline</div>
                          <div className={kpi.deadline === 'Overdue' ? 'text-danger fw-bold' : ''}>{kpi.deadline}</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="d-flex align-items-center gap-2 text-muted small">
                        <FileText size={14} />
                        <div>
                          <div className="fw-bold" style={{ fontSize: '10px' }}>Evidence</div>
                          <div>{kpi.evidence}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="badge bg-light text-muted border px-2">{kpi.category}</span>
                    <span className="small text-muted" style={{ fontSize: '10px' }}>Updated {kpi.lastUpdate}</span>
                  </div>

                  <button 
                    className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    onClick={() => handleUpdateClick(kpi)}
                  >
                    <UploadCloud size={18} /> Update Progress
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Update Progress Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow p-2">
              <div className="modal-header border-0">
                <div>
                  <h5 className="modal-title fw-bold">Update KPI Progress</h5>
                  <p className="text-muted small m-0">Update your progress and submit evidence for: {selectedKPI?.title}</p>
                </div>
                <button type="button" className="btn-close shadow-none" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-4">
                  <label className="form-label small fw-bold">Current Value *</label>
                  <input type="number" className="form-control p-2 border-primary" defaultValue={selectedKPI?.progress} />
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-bold">Evidence Files</label>
                  <div className="border border-2 border-dashed rounded-3 p-5 text-center bg-light">
                    <UploadCloud size={40} className="text-muted mb-2" />
                    <div className="fw-bold">Drag & drop files here</div>
                    <div className="small text-muted mb-3">or</div>
                    <button className="btn btn-light border shadow-sm px-4">Browse Files</button>
                  </div>
                  <p className="small text-muted mt-2">Upload supporting documents for your progress update</p>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold">Notes (Optional)</label>
                  <textarea className="form-control" rows="3" placeholder="Add any additional notes about this update..."></textarea>
                </div>
              </div>
              <div className="modal-footer border-0 gap-2">
                <button type="button" className="btn btn-light border flex-grow-1 py-2" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary flex-grow-1 py-2" onClick={() => setShowModal(false)}>Submit Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffKPIUpdate;