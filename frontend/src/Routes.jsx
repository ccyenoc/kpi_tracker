import ManagerDashboard from "./pages/manager/manager-dashboard";
import StaffDashboard from "./pages/staff/staff-dashboard";
import KpiManagement from "./pages/manager/kpi-management";
import VerifyKPI from "./pages/manager/kpi_verification/verify-kpi";
import CreateKPI from "./pages/manager/kpi_management/create-kpi";
import VerifyKPIDashboard from "./pages/manager/verify-kpi-dashboard";
import KPIProgressPage from "./pages/manager/kpi_management/kpi-progress";
import ProfilePage from "./pages/common/ProfilePage";
import StaffKPIUpdate from "./pages/staff/staff-kpi-progress-update";
import UpdateKPI from "./pages/manager/kpi_management/update-kpi";
import StaffKpiProgressUpdate from "./pages/staff/staff-kpi-progress-update";

export const routes = (role) => {
  const normalizedRole = role?.toLowerCase();

  switch (normalizedRole) {
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
          path: "/manager/verify-kpi",
          element: <VerifyKPI />,
          breadcrumb: "Verify KPI",
          parent: "/manager/dashboard",
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
          element: <StaffKpiProgressUpdate />,
          breadcrumb: "KPI Progress Update",
          parent: "/staff/dashboard",
        },

        {
          path: "/staff/kpi/:kpiId",
          element: <StaffKpiProgressUpdate />,
          breadcrumb: "Update KPI",
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