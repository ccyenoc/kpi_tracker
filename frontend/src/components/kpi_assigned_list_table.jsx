import {useNavigate} from "react-router-dom"
import KPIProgressPage from "../pages/kpi-progress";
import { STATUS_CONFIG } from "../config/statusConfig";
{/*import mock data*/}
import { users } from "../data/userData";
import { categories } from "../data/categoriesData";

function KPIAssignedListTable({data}) {
  const navigate = useNavigate();

  const headerStyle = {
    display: "flex",
    textAlign:"left",
    fontWeight: "bold",
    fontSize:"16px",
    padding:"5px",
    borderBottom: "1px solid #e5e7eb",
  };

  const rowStyle = {
    display: "flex",
    textAlign:"left",
    padding: "15px 0",
    fontSize:"14px",
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

        const category = categories.find(c => c.id === item.categoryId);

        return (
        <div 
        key={index} 
        style={{
    ...rowStyle,
    cursor: "pointer"
  }}
        onClick={() => navigate("/kpi-progress", { state: item })}>
          
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
              color: "#6b7280" }}>
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
  item.assignedUserIds
    .map(id => users.find(u => u.id === id)?.name)
    .join(", ")
}</div>

          {/* Category */}
          <div 
          style={{
             flex: 2 }}>
           <span
  style={{
    background: category?.color || "#e5e7eb",
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "12px"
  }}
>
  {category?.name || "Unknown"}
</span>
          </div>

          <div 
          style={{ 
            flex: 1
           }}>{item.deadline}</div>

          {/* Status */}
          <div 
          style={{ 
            flex: 1 }}>
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

        </div> )
      })}
        </div>
      )
}

export default KPIAssignedListTable;