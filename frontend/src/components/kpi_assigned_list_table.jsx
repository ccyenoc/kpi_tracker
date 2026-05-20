import { useNavigate } from "react-router-dom"
import KPIProgressPage from "../pages/kpi-progress";
import { STATUS_CONFIG } from "../config/statusConfig";
import { pathway } from "../Pathway";
{/*import mock data*/ }
import { users as mockUsers } from "../data/userData";
import { categories } from "../data/categoriesData";

function KPIAssignedListTable({ data, users = [] }) {
  const navigate = useNavigate();
  
  // Use passed users, fall back to mock if needed
  const usersList = users && users.length > 0 ? users : mockUsers;

  // Color mapping for categories based on their names
  const categoryColorMap = {
    "sales": "#639fff",
    "lead": "#7ef203",
    "property": "#fff200",
    "marketing": "#df93ff",
    "customer": "#ff67e386",
    "Sales Performance": "#639fff",
    "Lead Generation": "#7ef203",
    "Property Management": "#fff200",
    "Marketing Performance": "#df93ff",
    "Customer Experience": "#ff67e386",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No deadline";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
      });
    } catch (e) {
      return dateString;
    }
  };

  const headerStyle = {
    display: "flex",
    textAlign: "left",
    fontWeight: "bold",
    fontSize: "16px",
    padding: "5px",
    borderBottom: "1px solid #e5e7eb",
  };

  const rowStyle = {
    display: "flex",
    textAlign: "left",
    padding: "15px 0",
    fontSize: "14px",
    borderBottom: "1px solid #e5e7eb",
    alignItems: "center",
  };

  const badgeStyle = {
    background: "#e5e7eb",
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "12px",
  };

  const statusStyle = (status) => {
    const colors = {
      Completed: "#bbf7d0",       // green
      "At Risk": "#fde68a",       // yellow
      Pending: "#e9d5ff",         // purple
      "In Progress": "#bfdbfe",   // blue
      Underperformed: "#fecaca",  // red
    };

    return {
      background: colors[status] || "#e5e7eb", // fallback (gray)
      padding: "4px 10px",
      borderRadius: "10px",
      fontSize: "12px",
    };
  };

  return (
    <div style={{ marginTop: "20px" }}>

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ flex: 3 }}>KPI Title</div>
        <div style={{ flex: 1 }}>Target</div>
        <div style={{ flex: 2 }}>Assigned To</div>
        <div style={{ flex: 2 }}>Category</div>
        <div style={{ flex: 1 }}>Deadline</div>
        <div style={{ flex: 1 }}>Status</div>
      </div>

      {/* Rows */}
      {data.map((item, index) => {
        const config = STATUS_CONFIG[item.status];

        // Use categoryName from backend, with fallback logic
        const categoryName = item.categoryName || 
          (categories.find(c => c.id === item.categoryId)?.name) || 
          "Unknown";
        
        // Get color from the mapping, with fallback
        const categoryColor = categoryColorMap[categoryName] || 
          categoryColorMap[item.categoryId] ||
          categories.find(c => c.name === categoryName || c.id === item.categoryId)?.color || 
          "#e5e7eb";

        return (
          <div
            key={index}
            style={{ ...rowStyle, cursor: "pointer" }}
            onClick={() => {
              console.log("clicked", item);
              navigate(pathway.KPIProgressPage, { state: item });
            }}
          >
            {/* Title */}
            <div style={{
              flex: 3
            }}>
              <div
                style={{
                  fontWeight: "500"
                }}>{item.title}</div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280"
                }}>
                {item.description}
              </div>
            </div>

            <div
              style={{
                flex: 1
              }}>{item.target} {item.unit}</div>

            <div
              style={{
                flex: 2
              }}>{
                (item.assignedUserIds && item.assignedUserIds.length > 0)
                  ? item.assignedUserIds
                      .map(id => usersList.find(u => u.id === id)?.name || `User ${id}`)
                      .filter(name => name)
                      .join(", ")
                  : (item.kpiAssignments && item.kpiAssignments.length > 0)
                  ? item.kpiAssignments
                      .map(assign => usersList.find(u => u.id === assign.userId)?.name || `User ${assign.userId}`)
                      .filter(name => name)
                      .join(", ")
                  : "Unassigned"
              }</div>

            {/* Category */}
            <div
              style={{
                flex: 2
              }}>
              <span
                style={{
                  background: categoryColor,
                  padding: "4px 10px",
                  borderRadius: "10px",
                  fontSize: "12px"
                }}
              >
                {categoryName}
              </span>
            </div>

            <div
              style={{
                flex: 1
              }}>{formatDate(item.deadline)}</div>

            {/* Status */}
            <div
              style={{
                flex: 1
              }}>
              <span
                style={{
                  background: config?.color || "#e5e7eb",
                  padding: "4px 10px",
                  borderRadius: "10px",
                  fontSize: "12px"
                }}
              >
                {config?.label || item.status}
              </span>
            </div>

          </div>)
      })}
    </div>
  )
}

export default KPIAssignedListTable;