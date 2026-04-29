const StaffRecentActivityCard = ({title, action, time})=>{
    
    const activityStyle = {
  completed: {
    color: "#22c55e",
    bg: "#22c55e42",
    icon: "✅"
  },
  assigned: {
    color: "#a855f7",
    bg: "#a955f72a",
    icon: "🆕"
  },
  rejected: {
    color: "#ef4444",
    bg: "#ef44444a",
    icon: "❌"
  },
  default: {
    color: "#3b82f6",
    bg: "#3b83f634",
    icon: "🎯",
  }
};

const style = activityStyle[action] || activityStyle.default;

     return (
    <div
      className="d-flex"
      style={{
        padding:"10px",
        gap: "10px",
        marginBottom: "12px",
        alignItems: "start",
        backgroundColor: style.bg,
        border: `1px solid ${style.color}`,
        textAlign:"start",
        borderRadius:"20px",
          }}
    >
      {/* Icon */}
      <div
  style={{
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: style.color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px"
  }}
>
  {style.icon}
</div>

      {/* Text */}
      <div style={{ 
        flex: 1 
        }}>
        <h3 style={{ 
            fontSize: "13px", margin: 0 }}>
         {title}
        </h3>

        <h3 
        style={{ 
            fontSize: "11px", 
            color: "#9ca3af" }}>
          {time}
        </h3>
      </div>
    </div>
  );
}

export default StaffRecentActivityCard