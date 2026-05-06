import { Search, Bell } from "lucide-react";
import TopBreadcrumb from "./top_breadcrumb";
import { useLocation } from "react-router-dom";
import { routes } from "../Routes";
import { useAuth } from "../Auth.jsx";

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/signin";
    } catch (error) {
      console.error("Logout error:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/signin";
    }
  };

  const routeList = routes(user?.role);

  const routeMap = Object.fromEntries(
    routeList.map((r) => [r.path, r])
  );

  let current = routeMap[location.pathname];
  const breadcrumbs = [];

  while (current) {
    breadcrumbs.unshift({
      label: current.breadcrumb,
      path: current.path,
    });

    current = current.parent
      ? routeMap[current.parent]
      : null;
  }

  return (
    <header
      className="d-flex justify-content-between align-items-center px-4 border-bottom bg-white position-sticky top-0"
      style={{ height: "64px" }}
    >
      {breadcrumbs.length > 1 ? (
        <TopBreadcrumb items={breadcrumbs} />
      ) : (
        <h5 className="m-0">
          {breadcrumbs[0]?.label || "Dashboard"}
        </h5>
      )}

    </header>
  );
}