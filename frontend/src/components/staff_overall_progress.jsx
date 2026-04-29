const StaffOverallProgress = ({kpis}) => {
    const total = kpis.length;

     const counts = {
         completed: kpis.filter(k => k.status === "completed").length,
         in_progress: kpis.filter(k => k.status === "in_progress").length,
         at_risk: kpis.filter(k => k.status === "at_risk").length,
         underperformed: kpis.filter(k => k.status === "underperformed").length,
         pending: kpis.filter(k => k.status === "pending").length,
};


const colors = {
  completed: "#22c55e",
  in_progress: "#3b82f6",
  at_risk: "#facc15",
  underperformed: "#ef4444",
  pending: "#a855f7",
};

return(
  <div
    className="d-flex"
    style={{
        flexDirection:"column",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        padding:"20px",
        borderRadius:"20px",
        width:"100%",
    }}>

        {/*title and subtitle*/}
        <div>
          <h3
           style={{
            fontSize:"16px",
           }}>Overall Progress</h3>
          <h3
            style={{
            fontSize:"14px",
            color: "#6b7280", 
           }}>Your KPI Progress Breakdown</h3>
        </div>

        <div
  style={{
    display: "flex",
    width: "100%",
    height: "10px",
    borderRadius: "10px",
    overflow: "hidden",
    backgroundColor: "#e5e7eb"
  }}
>
  {Object.keys(counts).map((key) => {
    const value = counts[key];
    if (value === 0) return null;

    return (
      <div
        key={key}
        style={{
          width: `${(value / total) * 100}%`,
          backgroundColor: colors[key]
        }}
      />
    );
  })}
</div>

<div style={{ marginTop: "10px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
 {Object.keys(counts).map((key) => {
    const percentage = total === 0
      ? 0
      : Math.round((counts[key] / total) * 100);

    return (
      <div
        key={key}
        style={{
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          gap: "4px"
        }}
      >
        <div
          style={{
            width: "10px",
            height: "10px",
            backgroundColor: colors[key],
            borderRadius: "2px"
          }}
        />
        {key.replace("_", " ")} ({counts[key]} • {percentage}%)
      </div>
    );
  })}
</div>
        

  </div>)
}

export default StaffOverallProgress