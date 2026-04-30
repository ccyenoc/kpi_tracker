import { user, useState } from "react";
  import ManagerSidebar from"../components/Sidebar";
  import PageTitle from "../components/page_title";
  import DashboardCards from "../components/4x1_cards_layout";
  import KPISubmissionTable from "../components/kpi_submission_table";
  import Header from "../components/Header";
  {/*import data*/}
  import { submissions } from "../data/submissionData";


  function VerifyKPIDashboard(){
          {/*DATA*/}
          {/*DASHBOARD DATA*/}
          const stats = [
          {
          title: "Total Submissions",
          value: submissions.length,
          subtitle: "All KPI Submissions",
          color: "#3b82f6"
          },
          {
          title: "Pending Verification",
          value: submissions.filter(s => s.status === "pending").length,
          subtitle: "Awaiting Review",
          color: "#facc15"
          },
          {
          title: "Approved",
          value: submissions.filter(s => s.status === "approved").length,
            subtitle: "Successfully Verified",
            color: "#22c55e"
          },
          {
          title: "Rejected",
          value: submissions.filter(s => s.status === "rejected").length,
          subtitle: "Needs Improvement",
          color: "#ef4444"
        }
        ];

      return (
          <div 
            className="d-flex"
            style={{
              display: "flex",
              flexDirection : "column",
            }}>
          

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
          <DashboardCards stats={stats} />

        <KPISubmissionTable submissions={submissions} />

        </div>


      )
  }

  export default VerifyKPIDashboard;