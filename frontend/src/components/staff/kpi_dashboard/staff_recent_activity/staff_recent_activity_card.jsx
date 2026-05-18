const StaffRecentActivityCard = ({ title, action, time, details }) => {
  
  const activityStyle = {
    completed: {
      color: "#22c55e",
      bg: "#f0fdf4",
      tagBg: "#22c55e",
      tagColor: "#ffffff",
      icon: "check_circle",
      label: "Verified",
      prefix: "Verified KPI - "
    },
    assigned: {
      color: "#a855f7",
      bg: "#faf5ff",
      tagBg: "#eff6ff",
      tagColor: "#1d4ed8",
      icon: "radio_button_checked",
      label: "New",
      prefix: "New KPI Assigned - "
    },
    default: {
      color: "#64748b",
      bg: "#f8fafc",
      tagBg: "#e2e8f0",
      tagColor: "#475569",
      icon: "info",
      label: "Update",
      prefix: "Update - "
    }
  };

  const style = activityStyle[action] || activityStyle.default;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        boxSizing: "border-box",
        padding: "16px 20px",
        gap: "16px",
        marginBottom: "12px",
        alignItems: "center",
        backgroundColor: style.bg,
        border: `1px solid ${style.color}33`,
        textAlign: "start",
        borderRadius: "12px",
      }}
    >
      {/* Icon Circle */}
      <div
        style={{
          width: "42px",
          height: "42px",
          minWidth: "42px",
          borderRadius: "50%",
          backgroundColor: style.color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: "20px",
          opacity: 0.8
        }}
      >

        {action === "completed" ? "✔️" : "🔘"}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, paddingRight: "80px" }}>
        <h3 style={{ fontSize: "14px", margin: "0 0 2px 0", fontWeight: "600", color: "#334155" }}>
          {style.prefix}{title}
        </h3>

        <p style={{ fontSize: "13px", margin: "0 0 4px 0", color: "#64748b" }}>
          {details || "Performance update recorded"}
        </p>

        <p style={{ fontSize: "12px", margin: 0, color: "#94a3b8", display: "flex", alignItems: "center", gap: "4px" }}>
          🕒 {time}
        </p>
      </div>

      {/* Status Tag */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "20px",
          padding: "4px 12px",
          borderRadius: "8px",
          backgroundColor: style.tagBg,
          color: style.tagColor,
          fontSize: "12px",
          fontWeight: "600"
        }}
      >
        {style.label}
      </div>
    </div>
  );
};

export default StaffRecentActivityCard;