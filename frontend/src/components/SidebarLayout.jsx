import ManagerSidebar from "./manager_sidebar";

function SidebarLayout({ children }) {
    return (
        <div>
            <ManagerSidebar />
            <main>
                {children}
            </main>
        </div>
    );
}

export default SidebarLayout;