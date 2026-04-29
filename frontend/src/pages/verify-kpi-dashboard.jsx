import { user, useState } from "react";
import ManagerSidebar from "../components/Sidebar";
import PageTitle from "../components/page_title";
import DashboardCards from "../components/4x1_cards_layout";
import KPISubmissionTable from "../components/kpi_submission_table";

function VerifyKPIDashboard() {
  return (
    <div className="d-flex flex-column">

      <div
        className="d-flex"
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}>

        <PageTitle
          title="Verify KPI Submissions"
          subtitle="Review and approve staff KPI progress" />

      </div>

      {/*top 4 cards*/}
      <DashboardCards
        title1="Total Submissions"
        value1="3"
        subtitle1="All KPI Submissions"

        title2="Pending Verification"
        value2="3"
        subtitle2="Awaiting Review"

        title3="Approved"
        value3="1"
        subtitle3="Successfully Verified"

        title4="Rejected"
        value4="2"
        subtitle4="Needs Improvement"
      />

      <KPISubmissionTable />

    </div>


  )
}

export default VerifyKPIDashboard;