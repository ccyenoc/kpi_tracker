function ProgressKPIAssignStaff({ staffProgress = [], unit }) {

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 2fr 1fr",
    alignItems: "center",
    gap: "70px",
    textAlign: "start",
    fontSize: "14px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div
        style={{
          ...gridStyle,
          fontWeight: "bold",
          fontSize: "16px",
          paddingBottom: "10px",
          borderBottom: "1px solid #eee"
        }}
      >
        <div>Staff</div>
        <div>KPI</div>
        <div>Unit</div>
        <div>Progress</div>
        <div>Evidence</div>
      </div>

      {/* Rows */}
      {staffProgress.map((staff) => {
        const percentage = staff.target
  ? Math.round((staff.progress / staff.target) * 100)
  : 0;

        return (
          <div
            key={staff.staffId}
            style={{
              ...gridStyle,
              padding: "15px 0",
              borderBottom: "1px solid #eee"
            }}
          >

            {/* Staff */}
            <div>
              <strong>{staff.name}</strong><br />
              <span style={{ color: "#666" }}>{staff.email}</span>
            </div>

            {/* KPI */}
            <div>{staff.assignedKpi}</div>

            {/* Unit */}
            <div>{unit}</div>

            {/* Progress */}
            <div>
  {/* Top text */}
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    marginBottom: "6px"
  }}>
    <span style={{ fontWeight: "500" }}>
      {staff.progress} / {staff.target}
    </span>

    <span style={{ color: "#64748b" }}>
      {percentage}%
    </span>
  </div>

  {/* Progress bar */}
  <div style={{
    width: "100%",
    height: "10px",
    background: "#e2e8f0",
    borderRadius: "999px",
    overflow: "hidden"
  }}>
    <div style={{
      width: `${percentage}%`,
      height: "100%",
      background: "#2563eb",
      borderRadius: "999px",
      transition: "width 0.4s ease"
    }} />
  </div>
</div>

            {/* Evidence */}
            <div>{staff.evidenceCount} files</div>

          </div>
        );
      })}

    </div>
  );
}

export default ProgressKPIAssignStaff