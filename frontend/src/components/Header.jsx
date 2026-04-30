import { Search, Bell } from "lucide-react";
import TopBreadcrumb from "./top_breadcrumb.jsx";
import { useLocation } from "react-router-dom";
import { routes } from "../Routes.jsx";
import { useAuth } from "../Auth.jsx";

export default function Header() {
  const location = useLocation();
  const { user } = useAuth();

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
    <header className="d-flex justify-content-between align-items-center px-4 border-bottom bg-white position-sticky top-0"
      style={{ height: "64px",
             zIndex: 1050
    }}
      
    >
      {breadcrumbs.length > 1 ? (
        <TopBreadcrumb items={breadcrumbs} />
      ) : (
        <h5 className="m-0">
          {breadcrumbs[0]?.label || "Dashboard"}
        </h5>
      )}

      <div className="d-flex align-items-center gap-3">
        <Search />
        <Bell />
        <div
          className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center"
          style={{ width: 40, height: 40 }}
        >
          JS
        </div>
      </div>
    </header>
  );
}