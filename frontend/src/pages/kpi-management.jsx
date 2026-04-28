import {user, useState} from "react";
import DashboardCards from "../components/4x1_cards_layout";
import PageTitle from "../components/page_title";
import SearchFilterKPI from "../components/search_filter_kpi"
import KPIAssignedListCard from "../components/kpi_assigned_list";

function KPIManagement(){
     const temp_data = [
    {
      title: "Q1 Sales Target",
      desc: "Achieve quarterly sales revenue target",
      target: "500000 USD",
      team: "Sales Team",
      category: "Revenue",
      deadline: "3/31/2026",
      status: "Completed",
    },
    {
      title: "Customer Satisfaction Score",
      desc: "Maintain high customer satisfaction ratings",
      target: "90%",
      team: "Customer Service",
      category: "Quality",
      deadline: "6/30/2026",
      status: "In Progress",
    },
  ];

    return (
        <div className="d-flex flex-column">

        <div className="d-flex flex-row justify-content-between align-items-center">

        <PageTitle
          title="KPI Management"
          subtitle="Create, Update and Manage key performance indicators" />


        <button className="justify-content-center text-white border-0"
         style={{
            width :"120px",
            height: "40px",
            fontSize:"14px",
            margin:"0 20px 0 20px",
            backgroundColor:"#2b4cb3",
            borderColor:"#2b4cb3",
            borderRadius:"18px",
         }}>+ Create KPI
        </button>

        </div>

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

       <SearchFilterKPI />

       <KPIAssignedListCard data={temp_data}/>
       </div>



    )
}

export default KPIManagement