import Header from "./Header";
import ManagerSidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

function Layout({ children }) {
    return (
        <div className="d-flex">
            <ManagerSidebar />
            <div className="d-flex flex-column flex-grow-1">
                <Header />
                <main className="w-100 p-4 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default Layout;