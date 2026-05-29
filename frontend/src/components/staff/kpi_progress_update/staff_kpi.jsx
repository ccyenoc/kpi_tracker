const StaffKPI = ({ kpi, onUpdate }) => {

  const statusStyle = {
    completed: { color: "#22c55e", bg: "#22c55e20", label: "Completed" },
    in_progress: { color: "#3b82f6", bg: "#3b82f620", label: "In Progress" },
    at_risk: { color: "#facc15", bg: "#facc1520", label: "At Risk" },
    underperformed: { color: "#ef4444", bg: "#ef444420", label: "Underperformed" },
    pending: { color: "#a855f7", bg: "#a855f720", label: "Pending" }
  };

  const categoryColors = {
    sales: "#dbeafe",
    lead: "#dcfce7",
    property: "#fef3c7",
    marketing: "#fce7f3",
    customer: "#ede9fe",
  };

  const getCategoryColor = (category) => {
    return categoryColors[category?.toLowerCase()] || "#f3f4f6";
  };

  const currentVal = Number(kpi.current || 0);
  const targetVal = Number(kpi.target || 0);

  const percentage =
    targetVal > 0
      ? Math.min(100, Math.round((currentVal / targetVal) * 100))
      : 0;

  const displayStatus =
    percentage >= 100 ? "completed" : kpi.status;

  const current =
    statusStyle[displayStatus] || statusStyle.in_progress;

  const isCompleted =
    String(kpi.status || "").toLowerCase() === "completed" ||
    Number(kpi.progress || 0) >= 100;

    return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "15px"
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
        margin: 0
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
            margin: 0
         }}>Progress</h3>

         <h3
           style={{
             fontSize: "14px",
              fontWeight: "500",
              margin: 0
            }}>{kpi.progressText} </h3>
        </div>

        {/* bar */}
        <div
          style={{
            height: "8px",
            background: "#e5e7eb",
            borderRadius: "50px",
            marginTop: "8px"
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              background: "#2563eb",
              height: "100%",
              borderRadius: "50px",
            }}
          />
        </div>

      </div>

      {/* INFO */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
        <div>📅 Deadline: {kpi.deadlineText}</div>
        <div style={{ textAlign: "right" }}>📄 Evidence: {kpi.evidence || "0 files"}</div>
      </div>

      {/* FOOTER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span
          style={{
            background: getCategoryColor(kpi.categoryId ),
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
        type="button"
        disabled={isCompleted}
        onClick={() => {
          if (!isCompleted) {
            onUpdate();
          }
        }}
        style={{
          width: "100%",
          padding: "14px",
          border: "none",
          borderRadius: "12px",
          background: isCompleted ? "#cbd5e1" : "#2563eb",
          color: isCompleted ? "#64748b" : "#ffffff",
          cursor: isCompleted ? "not-allowed" : "pointer",
          opacity: isCompleted ? 0.75 : 1,
        }}
      >
        {isCompleted ? "✓ Completed" : "⬆ Update Progress"}
      </button>
    </div>
  );
};


export default StaffKPI