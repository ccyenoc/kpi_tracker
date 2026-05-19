import StaffRecentActivityCard from "./staff_recent_activity_card";

function StaffRecentActivity({ userActivities = [] }) {
  return (
    <div
      className="d-flex"
      style={{
        marginTop: "20px",
        width: "100%",
        padding: "20px",
        borderRadius: "12px",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        boxSizing: "border-box",
        alignItems: "stretch"
      }}
    >
      {/* title and subtitle */}
      <h3
        style={{
          fontSize: "16px",
          textAlign: "start",
          margin: "0px",
        }}
      >
        Recent Activity
      </h3>

      <h3
        style={{
          fontSize: "14px",
          margin: "0px",
          textAlign: "start",
          marginBottom: "20px",
          color: "#64748b",
        }}
      >
        Latest Update
      </h3>

      {/* activities */}
      {userActivities.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
          No recent activity yet.
        </p>
      ) : (
        userActivities.map((activity) => (
          <StaffRecentActivityCard
            key={activity.id}
            title={activity.title}
            action={activity.status || activity.action || "default"}
            time={activity.time || activity.submittedAt || activity.createdAt}
            details={activity.description}
            icon={activity.icon}
            iconBg={activity.iconBg}
          />
        ))
      )}
    </div>
  );
}

export default StaffRecentActivity;