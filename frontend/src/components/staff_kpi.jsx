const StaffKPI = ({ kpi, onUpdate }) => {

  const statusStyle = {
    completed: { color: "#22c55e", bg: "#22c55e20", label: "Completed" },
    in_progress: { color: "#3b82f6", bg: "#3b82f620", label: "On Track" },
    at_risk: { color: "#facc15", bg: "#facc1520", label: "At Risk" },
    underperformed: { color: "#ef4444", bg: "#ef444420", label: "Underperformed" },
    pending: { color: "#a855f7", bg: "#a855f720", label: "Pending" }
  };

  const current = statusStyle[kpi.status] || statusStyle.in_progress;

  const [currentVal, targetVal] = kpi.progressText
    .split(" ")[0]
    .split("/")
    .map(Number);

  const percentage =
    targetVal === 0 ? 0 : Math.round((currentVal / targetVal) * 100);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3 
        style={{
            margin: 0,
            fontSize:"16px",
             }}>{kpi.title}</h3>

        <span
          style={{
            background: current.bg,
            color: current.color,
            padding: "4px 10px",
            borderRadius: "999px",
            fontSize: "12px"
          }}
        >
          {current.label}
        </span>
      </div>

      {/* DESCRIPTION */}
      <h3 
      style={{ 
        color: "#6b7280", 
        fontSize: "14px",
        textAlign:"start",
         }}>{kpi.description || "No description"}
      </h3>

      {/* PROGRESS */}
      <div>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between",
            alignItems: "center"
        }}>
         <h3 
         style={{ 
            fontSize: "14px",
         }}>Progress</h3>

         <h3
           style={{
             fontSize: "14px",
              fontWeight: "500" 
            }}>{kpi.progressText} </h3>
        </div>

        {/* bar */}
        <div
          style={{
            height: "8px",
            background: "#e5e7eb",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              background: "#2563eb",
              height: "100%"
            }}
          />
        </div>

      </div>

      {/* INFO */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
        <div>📅 {kpi.deadlineText}</div>
        <div>📄 {kpi.evidence || "0 files"}</div>
      </div>

      {/* FOOTER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            background: kpi.categoryColor,
            padding: "4px 10px",
            borderRadius: "10px",
            fontSize: "12px"
          }}
        >
          {kpi.categoryName || "General"}
        </span>

        <span style={{ fontSize: "12px", color: "#9ca3af" }}>
          Updated {kpi.updatedAt || "recently"}
        </span>
      </div>

      {/* BUTTON */}
      <button
        onClick={onUpdate}
        style={{
          marginTop: "10px",
          background: "#2563eb",
          color: "#fff",
          border: "none",
          padding: "10px",
          borderRadius: "10px",
          cursor: "pointer",
          fontSize:"16px",
        }}
      >
        ⬆ Update Progress
      </button>
    </div>
  );
};


export default StaffKPI