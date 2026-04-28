import ManagerSidebar from "./manager_sidebar";

function SidebarLayout({ children }) {
    return (
        <div className="d-flex">
            <ManagerSidebar />
            <main className="w-100 p-4 overflow-auto">
                {children}
            </main>
        </div>
    );
}

export default SidebarLayout;