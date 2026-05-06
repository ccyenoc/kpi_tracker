import CircularProgress from "./circular_progress";

function TopStaffCard({ name, kpi, timeliness, quality, performance, rank }) {
  return (
    <div
      style={{
        background: "#facc15",
        boxShadow: `
          0 4px 6px rgba(0,0,0,0.05),
          0 10px 20px rgba(0,0,0,0.08)
        `,
        borderRadius: "20px",
        padding: "16px",
        marginBottom: "16px",
        marginTop: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px"
        }}
      >

        {/* LEFT SIDE */}
        <div style={{ flex: 1 }}>

          {/* avatar + name */}
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <img
              src="https://i.pravatar.cc/60"
              style={{ borderRadius: "10px", width: "60px", height: "60px" }}
            />
            <p style={{ fontWeight: "600" }}>{name}</p> 
          </div>

          {/* KPI box */}
          <div
            style={{
              background: "#fff",
              borderRadius: "14px",
              padding: "12px",
              marginTop: "12px",
            }}
          >
            <div style={{ fontSize: "14px", display: "flex", justifyContent: "space-between" }}>
              <span>KPI Completion</span>
              <span>{kpi}%</span>
            </div>

            <div style={{ fontSize: "14px", display: "flex", justifyContent: "space-between" }}>
              <span>Timeliness</span>
              <span>{timeliness}%</span>
            </div>

            <div style={{ fontSize: "14px", display: "flex", justifyContent: "space-between" }}>
              <span>Quality</span>
              <span>{quality}%</span>
            </div>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "13px", color: "#666" }}>
            Performance
          </p>
          <CircularProgress value={performance} /> 
        </div>

      </div>
    </div>
  );
}

export default TopStaffCard;