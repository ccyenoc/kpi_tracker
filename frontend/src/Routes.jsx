import ManagerDashboard from "./pages/manager-dashboard";
import StaffDashboard from "./pages/staff-dashboard";
import KpiManagement from "./pages/kpi-management";
import VerifyKPI from "./pages/verify-kpi";
import CreateKPI from "./pages/create-kpi";
import VerifyKPIDashboard from "./pages/verify-kpi-dashboard";
import KPIProgressPage from "./pages/kpi-progress";
import ProfilePage from "./pages/ProfilePage";
import StaffKPIUpdate from "./pages/staff-kpi-progress-update";
import UpdateKPI from "./pages/update-kpi";

export const routes = (role) => {
  switch (role) {
    case "manager":
      return [
        {
          path: "/manager/dashboard",
          element: <ManagerDashboard />,
          breadcrumb: "Dashboard",
        },
        {
          path: "/manager/kpi-management",
          element: <KpiManagement />,
          breadcrumb: "KPI Management",
          parent: "/manager/dashboard",
        },
        {
          path: "/manager/create-kpi",
          element: <CreateKPI />,
          breadcrumb: "Create KPI",
          parent: "/manager/kpi-management",
        },
        {
          path: "/manager/kpi-progress",
          element: <KPIProgressPage />,
          breadcrumb: "KPI Progress",
          parent: "/manager/kpi-management",
        },
        {
          path: "/manager/verify-kpi-dashboard",
          element: <VerifyKPIDashboard />,
          breadcrumb: "Verify KPI Dashboard",
          parent: "/manager/dashboard",
        },
        {
          path: "/manager/verify-kpi",
          element: <VerifyKPI />,
          breadcrumb: "Verify KPI",
          parent: "/manager/verify-kpi-dashboard",
        },
        {
          path: "/profile",
          element: <ProfilePage />,
          breadcrumb: "Profile",
          parent: "/manager/dashboard",
        },
         {
          path: "/manager/update-kpi",
          element: <UpdateKPI />,
          breadcrumb: "Update KPI",
          parent: "/manager/kpi-management",
        },
      ];

    case "staff":
      return [
        {
          path: "/staff/dashboard",
          element: <StaffDashboard />,
          breadcrumb: "Dashboard",
        },
        {
          path: "/staff/kpi",
          element: <StaffKPIUpdate />,
          breadcrumb: "Staff KPI Update",
          parent: "/staff/dashboard",
        },
        {
          path: "/profile",
          element: <ProfilePage />,
          breadcrumb: "Profile",
          parent: "/staff/dashboard",
        },
      ];

    default:
      return [];
  }
};