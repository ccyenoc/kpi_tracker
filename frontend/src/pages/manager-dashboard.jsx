// since that we are using vite we dont need to import react anymore
import PageTitle from "../components/page_title.jsx";
import DashboardCards from "../components/4x1_cards_layout";
import ExportBar from "../components/export-bar";
import RectangleGraphCard from "../components/rectangle_graph_card.jsx";
import StaffRankingCard from "../components/staff_ranking_card.jsx";
import ManagerDashboardKpi from "../components/manager_dashboard_kpi.jsx";

function ManagerDashboard() {
  return (<div className="d-flex flex-column w-100">
      {/* welcome message */}
      <PageTitle
          title={`Welcome back, John!`}
          subtitle="Here's an overview of your performance tracking dashboard" />

      {/*top 4 cards*/}
      <DashboardCards
        title1="Total KPIs"
        value1="3"
        subtitle1="All defined KPIs"
        title2="Active KPIs"
        value2="3"
        subtitle2="Currently in progress"
        title3="Completed"
        value3="1"
        subtitle3="Finished KPIs"
        title4="High Priority"
        value4="2"
        subtitle4="Requires attention"
      />

      <ExportBar />
      <RectangleGraphCard />

      <div
        className="p-2 d-flex flex-row"
        style={{
          gap: "20px",
          width: "100%",
          flexWrap: "wrap",
        }}>
        <StaffRankingCard />
        <ManagerDashboardKpi />
      </div>

    </div>
  );
}

export default ManagerDashboard;