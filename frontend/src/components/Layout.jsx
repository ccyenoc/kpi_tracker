import { useLocation } from "react-router-dom";
import Header from "./Header";
import ManagerSidebar from "./Sidebar";

function Layout({ children }) {
    const location = useLocation();
    const titleMap = {
        "/manager/dashboard": "Manager Dashboard",
        "/kpi-management": "KPI Management",
        "/verify-kpi": "Verify KPI",
        "/verify-kpi-dashboard": "Verify KPI Dashboard",
        "/create-kpi": "Create KPI",
        "/kpi-progress": "KPI Progress",
        "/staff-dashboard": "Staff Dashboard",
        "/staff-kpi": "My KPIs",
        "/profile": "Profile",
    };
    const title = titleMap[location.pathname] || "Dashboard";

    return (
        <div className="d-flex">
            <ManagerSidebar />
            <div className="d-flex flex-column flex-grow-1">
                <Header title={title} />
                <main className="w-100 p-4 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;