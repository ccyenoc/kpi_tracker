import Sidebar from ".components/staff-sidebar";
import Header from ".components/staff-header";

export default function Layout({ children, title, activePage }) {
  return (
    <div className="d-flex">
      <Sidebar activePage={activePage} />

      <div className="flex-grow-1">
        <Header title={title} />

        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
}