// pages/kpi-management.jsx
import { useEffect, useState } from "react";
import DashboardCards from "../components/4x1_cards_layout";
import PageTitle from "../components/page_title";
import SearchFilterKPI from "../components/search_filter_kpi";
import KPIAssignedListCard from "../components/kpi_assigned_list";
import { NavLink } from "react-router-dom";
import { pathway } from "../Pathway";
import { fetchManagerKPIs, fetchAllUsers, fetchCategories } from "../api/api";

function KPIManagement() {
  const [kpis, setKpis] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchKPI, setSearchKPI] = useState("");
  const [searchStaff, setSearchStaff] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchManagerKPIs(), fetchAllUsers()])
      .then(([kpiData, userData]) => {
        setKpis(kpiData.kpis || []);
        setUsers(userData.users || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      title: "Total KPIs",
      value: kpis.length,
      subtitle: "All defined KPIs",
      color: "#3b82f6",
    },
    {
      title: "Active KPIs",
      value: kpis.filter((k) => k.status === "active" || k.status === "in_progress").length,
      subtitle: "Currently in progress",
      color: "#22c55e",
    },
    {
      title: "Pending Verification",
      value: kpis.filter((k) => k.status === "pending").length,
      subtitle: "Pending for approval",
      color: "#facc15",
    },
    {
      title: "High Priority",
      value: kpis.filter((k) => k.priority === "high").length,
      subtitle: "Requires attention",
      color: "#ef4444",
    },
  ];

  const filteredKPIs = kpis.filter((kpi) => {
    const matchTitle =
      searchKPI === "" ||
      kpi.title?.toLowerCase().includes(searchKPI.toLowerCase());

    const matchStaff =
      searchStaff === "" ||
      (kpi.assignedUserIds &&
        kpi.assignedUserIds.some((id) => {
          const user = users.find((u) => u.id === id);
          return (
            user && user.name.toLowerCase().includes(searchStaff.toLowerCase())
          );
        })) ||
      // also match single assignedTo field used by the manager KPI endpoint
      (() => {
        const user = users.find((u) => u.id === kpi.assignedTo);
        return (
          user && user.name.toLowerCase().includes(searchStaff.toLowerCase())
        );
      })();

    const matchCategory =
      filterCategory === "" ||
      kpi.categoryId === filterCategory ||
      kpi.category === filterCategory ||
      kpi.categoryName === filterCategory;

    const matchStatus =
      filterStatus === "" || kpi.status === filterStatus;

    return matchTitle && matchStaff && matchCategory && matchStatus;
  });

  return (
    <div
      className="d-flex"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        className="d-flex"
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <PageTitle
          title="KPI Management"
          subtitle="Create, Update and Manage key performance indicators"
        />

        <NavLink to={pathway.CreateKPI} style={{ textDecoration: "none" }}>
          <button
            className="justify-content-center text-white border-0"
            style={{
              width: "120px",
              height: "40px",
              fontSize: "14px",
              margin: "0 20px",
              backgroundColor: "#2b4cb3",
              borderRadius: "18px",
            }}
          >
            + Create KPI
          </button>
        </NavLink>
      </div>

      {error && (
        <div style={{ color: "#d93025", padding: "10px 20px" }}>
          Failed to load data: {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#888" }}>
          Loading KPIs…
        </div>
      ) : (
        <>
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
            users={users}
          />
          <KPIAssignedListCard data={filteredKPIs} users={users} />
        </>
      )}
    </div>
  );
}

export default KPIManagement;