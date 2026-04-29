

const StaffKPICard = ({ kpi }) => {
  const statusStyle = {
    completed: { 
        border: "#22c55e", 
        bg: "#22c55e20" ,
        icon : "✅"
    },
    in_progress: { 
        border: "#3b82f6", 
        bg: "#3b82f620" ,
        icon : "⏳",
    },
    at_risk: { 
        border: "#ffe600", 
        bg: "#ffe6006a" ,
        icon:"⚠️",
    },
     underperformed: { 
        border: "#ff0000", 
        bg: "#ff000044" ,
        icon:"❌",
    },
    pending: { 
        border: "#9900ff", 
        bg: "#9900ff31" ,
        icon:"🕒",
    },
  };

  const current = statusStyle[kpi.status] || statusStyle.in_progress;

  const [currentVal, targetVal] = kpi.progressText
  .split(" ")[0]        // "30 / 50"
  .split("/")
  .map(Number);

const percentage = Math.round((currentVal / targetVal) * 100);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        textAlign:"start",
        padding: "16px",
        borderRadius: "16px",
        border: `2px solid ${current.border}`,
        backgroundColor: current.bg,
        width:"100%",
        height:"90px",
      }}
    >
      {/* LEFT */}
      <div 
      style={{ 
        display: "flex", 
        gap: "12px", 
        alignItems: "center" 
        }}>
        
        {/* Icon */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: current.border,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {current.icon}
        </div>

        {/* Text */}
        <div>
          <h3 
          style={{ 
            margin: 0,
            fontSize:"14px", }}>{kpi.title}</h3>

            <div 
            className="d-flex"
            style={{ 
                width: "180px",
                flexDirection:"row",
                alignItems:"center" }}>

            {/*progress bar*/}
  <div
    style={{
      fontSize: "11px",
      textAlign: "start",
      color: "#374151"
    }}
  >
    {percentage}%
  </div>

         <div
    style={{
      width: "100%",
      height: "6px",            // 🔥 thinner bar
      backgroundColor: "#e5e7eb",
      borderRadius: "10px",
      overflow: "hidden"
    }}
  >
    {/* progress fill */}
    <div
      style={{
        width: `${percentage}%`,
        height: "100%",
        backgroundColor: current.border,
        borderRadius: "10px",
        transition: "0.3s"
      }}
    />
  </div>
  </div>

          <h3 
          style={{
             margin: 0, 
             color: "#64748b",
             fontSize:"12px", }}>
            ⏱ {kpi.deadlineText}
          </h3>
        </div>
      </div>

      {/* RIGHT BADGE */}
      <div
        className="d-flex"
        style={{
          backgroundColor: current.border,
          color: "white",
          alignItems:"center",
          textStart:"center",
          borderRadius: "20px",
          fontSize: "12px",
          height:"40%",
          width:"90px",
        }}
      >
        {kpi.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
      </div>
    </div>
    
  );
};

export default StaffKPICard;