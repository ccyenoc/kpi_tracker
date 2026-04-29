const StaffKPICard = ({ kpi }) => {
  const statusStyle = {
    completed: { border: "#22c55e", bg: "#f0fdf4", icon: "✅" },
    in_progress: { border: "#3b82f6", bg: "#eff6ff", icon: "⏳" },
    at_risk: { border: "#facc15", bg: "#fefce8", icon: "⚠️" },
    underperformed: { border: "#ef4444", bg: "#fef2f2", icon: "❌" },
    pending: { border: "#a855f7", bg: "#faf5ff", icon: "🕒" },
  };

  const current = statusStyle[kpi.status] || statusStyle.in_progress;

  // Extract numbers 
  const numbers = kpi.progressText.match(/\d+/g) || [0, 1];
  const currentVal = parseInt(numbers[0]);
  const targetVal = parseInt(numbers[1]);
  const percentage = Math.min(Math.round((currentVal / targetVal) * 100), 100);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderRadius: "16px",
        border: `1px solid ${current.border}`,
        backgroundColor: current.bg,
        width: "100%",
        height: "100px",
        boxSizing: "border-box",
        marginBottom: "12px"
      }}
    >
      {/* LEFT SECTION */}
      <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            backgroundColor: current.border,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px"
          }}
        >
          {current.icon}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#1e293b" }}>
            {kpi.title}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#475569", minWidth: "35px" }}>
              {percentage}%
            </span>
            <div style={{
              width: "140px",
              height: "8px",
              backgroundColor: "#e2e8f0",
              borderRadius: "10px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${percentage}%`,
                height: "100%",
                backgroundColor: current.border,
                borderRadius: "10px",
                transition: "width 0.5s ease-in-out"
              }} />
            </div>
          </div>

          <span style={{ fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
            ⏱ {kpi.deadlineText}
          </span>
        </div>
      </div>

      {/* RIGHT BADGE */}
      <div
        style={{
          backgroundColor: current.border,
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "bold",
          padding: "6px 16px",
          minWidth: "100px",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}
      >
        {kpi.status.replace("_", " ").toUpperCase()}
      </div>
    </div>
  );
};

export default StaffKPICard;