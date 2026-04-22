import {user, useState} from "react";
import ManagerSidebar from "../components/manager_sidebar";
import DashboardCards from "../components/4x1_cards_layout";
import PageTitle from "../components/page_title";

function KPIManagement(){
    return (
        <div 
          className="d-flex"
          style={{
            marginLeft: "150px",
            display: "flex",
            flexDirection : "column",
          }}>
        
        <ManagerSidebar />

        <PageTitle
          title="KPI Management"
          subtitle="Create, Update and Manage key performance indicators" />

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
       </div>



    )
}

export default KPIManagement