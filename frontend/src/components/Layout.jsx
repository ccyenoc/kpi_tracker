import Header from "./Header";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

function Layout({ children }) {
    return (
        <div className="d-flex">
            <Sidebar />
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