import { LayoutDashboard, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sidebar({ activePage }) {
  return (
    <div 
      className="d-flex flex-column flex-shrink-0 p-3 text-white"
      /* min-vh-100 ensures it is at least screen height */
      /* h-auto allows it to grow if the content is longer than the screen */
      style={{ 
        width: '256px', 
        minHeight: '100vh', 
        height: 'auto', 
        backgroundColor: '#1E40AF' 
      }}
    >
      {/* REMOVED: PERFORM text div was here */}

      <ul className="nav nav-pills flex-column gap-2 mt-4">
        <li>
          <Link
            to="/"
            className={`nav-link text-white d-flex gap-2 align-items-center ${activePage === 'dashboard' ? 'active' : ''}`}
            style={activePage === 'dashboard' ? { backgroundColor: '#3B82F6' } : {}}
          >
            <LayoutDashboard size={20} /> Dashboard
          </Link>
        </li>

        <li>
          <Link
            to="/kpi"
            className={`nav-link text-white d-flex gap-2 align-items-center ${activePage === 'kpi' ? 'active' : ''}`}
            style={activePage === 'kpi' ? { backgroundColor: '#3B82F6' } : {}}
          >
            <Target size={20} /> My KPIs
          </Link>
        </li>
      </ul>

      {/* Profile Section - to keep the sidebar looking full even with items at the bottom */}
      <div className="mt-auto pt-4 border-top border-primary-subtle border-opacity-25">
        <div className="d-flex align-items-center gap-2 px-2 py-2 rounded">
          <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 32, height: 32, backgroundColor: '#155DFC', fontSize: '12px' }}>
            JS
          </div>
          <div>
            <div className="small fw-medium">Jane Staff</div>
            <div className="text-white-50" style={{ fontSize: '10px' }}>Staff</div>
          </div>
        </div>
      </div>
    </div>
  );
}