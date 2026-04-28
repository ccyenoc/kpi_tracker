import ManagerSidebar from "./manager_sidebar";

function SidebarLayout({ children }) {
    return (
        <div className="d-flex">
            <ManagerSidebar />
            <main>
                {children}
            </main>
        </div>
    );
}

export default SidebarLayout;