import {user, useState} from "react";
import ManagerSidebar from "../components/manager_sidebar";
import DashboardCards from "../components/4x1_cards_layout";
import PageTitle from "../components/page_title";
import SearchFilterKPI from "../components/search_filter_kpi"
import KPIAssignedListCard from "../components/kpi_assigned_list";
import { NavLink } from "react-router-dom";
import Header from "../components/header"
{/*mock data import*/}
import { kpis } from "../data/kpiData";

function KPIManagement(){
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
        title: "Pending Verification",
        value: kpis.filter(k => k.status === "pending").length,
        subtitle: "Pending for approval",
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
        <div 
          className="d-flex"
          style={{
            marginLeft: "150px",
            display: "flex",
            flexDirection : "column",
          }}>
        
        <ManagerSidebar />
        <Header />

        <div 
          className="d-flex"
          style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
          }}>

        <PageTitle
          title="KPI Management"
          subtitle="Create, Update and Manage key performance indicators" />


        <NavLink to="/create-kpi" style={{ textDecoration: "none" }}>
        <button className="justy-content-center"
         style={{
            width :"120px",
            height: "40px",
            fontSize:"14px",
            color:"#ffffff",
            backgroundColor:"#2b4cb3",
            borderColor:"#2b4cb3",
            borderRadius:"18px",
            border: "none",     
         }}>+ Create KPI
        </button>
        </NavLink>

        </div>

        {/*top 4 cards*/}
        <DashboardCards stats={stats}/>

       <SearchFilterKPI />

       <KPIAssignedListCard data={kpis}/>
       </div>



    )
}

export default KPIManagement