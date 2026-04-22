function KPIAssignedListTable({data}) {

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
        <div style={{ flex: 1 }}>Category</div>
        <div style={{ flex: 1 }}>Deadline</div>
        <div style={{ flex: 1 }}>Status</div>
      </div>

      {/* Rows */}
      {data.map((item, index) => (
        <div key={index} style={rowStyle}>
          
          {/* Title */}
          <div style={{ flex: 3 }}>
            <div style={{ fontWeight: "500" }}>{item.title}</div>
            <div style={{ fontSize: "13px", color: "#6b7280" }}>
              {item.desc}
            </div>
          </div>

          <div style={{ flex: 1 }}>{item.target}</div>
          <div style={{ flex: 2 }}>{item.team}</div>

          {/* Category */}
          <div style={{ flex: 1 }}>
            <span style={badgeStyle}>{item.category}</span>
          </div>

          <div style={{ flex: 1 }}>{item.deadline}</div>

          {/* Status */}
          <div style={{ flex: 1 }}>
            <span style={statusStyle(item.status)}>
              {item.status}
            </span>
          </div>

        </div>
      ))}
    </div>
  );
}

export default KPIAssignedListTable;