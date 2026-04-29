import { Search, Bell } from 'lucide-react';
import TopBreadcrumb from './top_breadcrumb';
import { useLocation } from "react-router-dom";
import { pathway } from "../pages/Pathway";

export default function Header() {
  const location = useLocation();
  const previousPath = {
    [pathway.CreateKPI]: pathway.KpiManagement,
    [pathway.KPIProgressPage]: pathway.KpiManagement,
    [pathway.VerifyKPI]: pathway.VerifyKPIDashboard,
  };
  const titleMap = {
    [pathway.ManagerDashboard]: "Dashboard",

    [pathway.KpiManagement]: "KPI Management",
    [pathway.CreateKPI]: "Create KPI",
    [pathway.KPIProgressPage]: "KPI Progress",

    [pathway.VerifyKPIDashboard]: "Verify KPI Dashboard",
    [pathway.VerifyKPI]: "Verify KPI",

    [pathway.StaffDashboard]: "Dashboard",
    [pathway.StaffKPIUpdate]: "My KPIs",

    [pathway.ProfilePage]: "Profile",
  };
  const title = titleMap[location.pathname] || "Dashboard";


  return (
    <header className="d-flex justify-content-between align-items-center px-4 border-bottom bg-white z-3 position-sticky top-0"
      style={{ height: '64px' }}>

      {title !== "Dashboard" && (
        <TopBreadcrumb
          items={[
            { label: titleMap[previousPath[location.pathname]] || "Dashboard", path: previousPath[location.pathname] || pathway.ManagerDashboard },
            { label: title }
          ]}
        />
      ) || (
        <h5 className="m-0">{title}</h5>
      )}

      <div className="d-flex align-items-center gap-3">
        <Search />
        <Bell />
        <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
          style={{ width: 40, height: 40 }}>
          JS
        </div>
      </div>
    </header>
  );
}