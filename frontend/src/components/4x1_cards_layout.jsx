// this is the basic card layout
function Card({ title, value, subtitle, color }) {
  return (
    <div
      style={{
        flex: "0 0 250px",  
        border: `2px solid ${color}`,
        borderRadius: "12px",
        borderLeft: `6px solid ${color}`,
        padding: "20px",
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Top title */}
      <div style={{ fontSize: "14px", color: "#374151" }}>
        {title}
      </div>

      {/* Big number */}
      <div style={{ fontSize: "28px", fontWeight: "bold", marginTop: "10px" }}>
        {value}
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "5px" }}>
        {subtitle}
      </div>
    </div>
  );
}

// this is for the dashboard top cards layout (4 x 1)
function DashboardCards() {
  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "0 20px 20px",
      }}
    >
      <Card
        title="Total KPIs"
        value="4"
        subtitle="All defined KPIs"
        color="#3b82f6"
      />

      <Card
        title="Active KPIs"
        value="3"
        subtitle="Currently in progress"
        color="#22c55e"
      />

      <Card
        title="Completed"
        value="1"
        subtitle="Finished KPIs"
        color="#facc15"
      />

      <Card
        title="High Priority"
        value="2"
        subtitle="Requires attention"
        color="#ef4444"
      />
    </div>
  );
}
export default DashboardCards;