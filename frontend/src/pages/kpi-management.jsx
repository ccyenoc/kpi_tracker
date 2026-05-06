import { useEffect, useState } from "react";
import DashboardCards from "../components/4x1_cards_layout";
import PageTitle from "../components/page_title";
import SearchFilterKPI from "../components/search_filter_kpi"
import KPIAssignedListCard from "../components/kpi_assigned_list";
import { NavLink } from "react-router-dom";
import Header from "../components/header"
import { pathway } from "../Pathway";
{/*mock data import*/ }
import { kpis } from "../data/kpiData";
import { users } from "../data/userData";

function KPIManagement() {
  console.log("KPIManagement loaded");

  {/*DATA*/ }
  {/*DASHBOARD DATA*/ }
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

  const [searchKPI, setSearchKPI] = useState("");
  const [searchStaff, setSearchStaff] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredKPIs = kpis.filter(kpi => {
    const matchTitle = searchKPI === "" ||
      kpi.title.toLowerCase().includes(searchKPI.toLowerCase());
    const matchStaff = searchStaff === "" ||
      (kpi.assignedUserIds && kpi.assignedUserIds.some(id => {
        const user = users.find(u => u.id === id);
        return user && user.name.toLowerCase().includes(searchStaff.toLowerCase());
      }));
   const matchCategory =
  filterCategory === "" ||
  kpi.categoryId === filterCategory;
    const matchStatus = filterStatus === "" ||
      kpi.status === filterStatus;
    return matchTitle && matchStaff && matchCategory && matchStatus;
  });

  return (
    <div
      className="d-flex"
      style={{
        display: "flex",
        flexDirection: "column",
      }}>


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


        <NavLink to={pathway.CreateKPI} style={{ textDecoration: "none" }}>
          <button className="justify-content-center text-white border-0"
            style={{
              width: "120px",
              height: "40px",
              fontSize: "14px",
              margin: "0 20px 0 20px",
              backgroundColor: "#2b4cb3",
              borderColor: "#2b4cb3",
              borderRadius: "18px",
            }}>+ Create KPI
          </button>
        </NavLink>

      </div>

      {/*top 4 cards*/}
      <DashboardCards stats={stats} />

      <SearchFilterKPI
        searchKPI={searchKPI}
        setSearchKPI={setSearchKPI}
        searchStaff={searchStaff}
        setSearchStaff={setSearchStaff}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      <KPIAssignedListCard data={filteredKPIs} />
    </div>



  )
}

export default KPIManagement