const styles = {
  progress: {
    bg: "#dcfce7",
    border: "#22c55e",
    badge: "#16a34a",
  },
  risk: {
    bg: "#fef9c3",
    border: "#facc15",
    badge: "#f59e0b",
  },
  underperform: {
    bg: "#fee2e2",
    border: "#ef4444",
    badge: "#dc2626",
  },
};

function KPIItem({ title, subtitle, timeLeft, status }) {
  const style = styles[status];

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <p 
          style={{ 
            fontWeight: "600", 
            margin: 0 
          }}>{title}</p>
        <p 
          style={{ 
            fontSize: "12px", 
            margin: "3px 0" 
            }}>{subtitle}</p>
        <p 
          style={{ 
            fontSize: "11px", 
            color: "#555" 
            }}>⏱ {timeLeft}</p>
      </div>

      <div
        style={{
          background: style.badge,
          color: "#fff",
          padding: "5px 10px",
          borderRadius: "20px",
          fontSize: "11px",
        }}
      >
        {status}
      </div>
    </div>
  );
}

export default KPIItem;