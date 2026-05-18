// since that we are using vite we dont need to import react anymore
import PageTitle from "../../components/common/page_title.jsx";
import DashboardCards from "../../components/common/4x1_cards_layout.jsx";
import ExportBar from "../../components/manager/kpi_dashboard/export-bar.jsx";
import RectangleGraphCard from "../../components/manager/kpi_dashboard/rectangle_graph_card.jsx";
import StaffRankingCard from "../../components/manager/kpi_dashboard/staff_ranking_card.jsx";
import ManagerDashboardKpi from "../../components/manager/kpi_dashboard/manager_dashboard_kpi.jsx";
import Sidebar from "../../components/common/layout/Sidebar.jsx";
import { getAtRiskKpis, getUnderperformKpis } from "../../utils/kpiUtils.js";
{/*mock data import*/}
import { kpis } from "../../data/kpiData.js";

function ManagerDashboard(){

  console.log("Manager Dashboard loaded");

  {/*DATA*/}
  {/*DASHBOARD DATA*/}
  const stats = [
  {
    title: "Total KPIs",
    value: kpis.length,
    subtitle: "All defined KPIs",
    color: "#3b82f6"
  },
  {
    title: "Active KPIs",
    value: kpis.filter(k => k.status === "in_progress").length,
    subtitle: "Currently in progress",
    color: "#22c55e"
  },
  {
    title: "Completed",
    value: kpis.filter(k => k.status === "completed").length,
    subtitle: "Finished KPIs",
    color: "#facc15"
  },
  {
    title: "High Priority",
    value: kpis.filter(k => k.priority === "high").length || 0,
    subtitle: "Requires attention",
    color: "#ef4444"
  }
];

   return (
    <div className="d-flex">


      <div 
        className="d-flex flex-column" 
        style={{
          width: "100%",
          backgroundColor: "#fff",
      }}>
      {/* welcome message */}
      <PageTitle
          title={"Welcome back, John!"}
          subtitle="Here's an overview of your performance tracking dashboard" />

      {/*top 4 cards*/}
       <DashboardCards stats={stats} />

      <ExportBar />
      <RectangleGraphCard />

      <div
        className="p-2 d-flex flex-row"
        style={{
          gap: "20px",
          width: "100%",

        }}>
        <StaffRankingCard />
        <ManagerDashboardKpi />
      </div>

    </div>
    </div>
  );
}

export default ManagerDashboard;