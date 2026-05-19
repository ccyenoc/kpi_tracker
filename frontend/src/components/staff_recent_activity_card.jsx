const StaffRecentActivityCard = ({ title, action, time, details, icon, iconBg }) => {
  
  const getTimeAgo = (dateValue) => {
    if (!dateValue) return "No date";

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
      return "No date";
    }

    const now = new Date();
    const diffMs = now - date;

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    if (diffDays === 1) return "1 day ago";

    return `${diffDays} days ago`;
};

  const activityStyle = {
    completed: {
      color: "#22c55e",
      bg: "#f0fdf4",
      tagBg: "#22c55e",
      tagColor: "#ffffff",
      icon: "✔️",
      label: "Verified",
      prefix: "Verified KPI - "
    },
    approved: {
      color: "#22c55e",
      bg: "#f0fdf4",
      tagBg: "#22c55e",
      tagColor: "#ffffff",
      icon: "✔️",
      label: "Approved",
      prefix: "Approved KPI - "
    },
    assigned: {
      color: "#a855f7",
      bg: "#faf5ff",
      tagBg: "#eff6ff",
      tagColor: "#1d4ed8",
      icon: "📌",
      label: "New",
      prefix: "New KPI Assigned - "
    },
    pending: {
      color: "#f59e0b",
      bg: "#fffbeb",
      tagBg: "#fef3c7",
      tagColor: "#92400e",
      icon: "⏳",
      label: "Pending",
      prefix: "Update - "
    },
    default: {
      color: "#3b82f6",
      bg: "#f8fafc",
      tagBg: "#dbeafe",
      tagColor: "#1d4ed8",
      icon: "📈",
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
          backgroundColor: iconBg || style.tagBg || "#dbeafe",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: style.tagColor || "#1d4ed8",
          fontSize: "22px"
        }}
      >
        {icon || style.icon || "📈"}
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
          🕒 {getTimeAgo(time)}
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