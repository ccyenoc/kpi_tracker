function KPIItem({ title, subtitle, timeLeft, status }) {

  const styles = {
  at_risk: {
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

const style = styles[status];

const statusLabelMap = {
  at_risk: "At Risk",
  underperform: "Underperform",
};

const numbers = subtitle.match(/\d+(\.\d+)?/g);
const current = parseFloat(numbers?.[0] || 0);
const total = parseFloat(numbers?.[1] || 1);

const progress = (current / total) * 100;

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: "12px",
        padding: "12px",
        marginBottom: "8px",
        display: "flex",
        flexDirection: "column",  
        gap:"8px",
      }}
    >
        
        <div 
        style={{ 
          display: "flex", 
          textAlign:"left",
          flexDirection:"row",
          alignItems:"center",
           justifyContent: "space-between",}}>
          <h3
          style={{ 
            fontWeight: "600", 
            fontSize: "14px", }}>
            {title}
          </h3>

          <div
            style={{
              background: style.badge,
              color: "#fff",
              padding: "5px 10px",
              borderRadius: "20px",
              fontSize: "11px",
            }}
          >
            {statusLabelMap[status] || status}
          </div>
        </div>

        <div
          style={{
            display:"flex",
            flexDirection:"row",
            gap:"8px",
            
          }}>
          {/*progress bar*/}
         <div
         style={{
            height: "6px",
            background: "#e5e7eb",
            borderRadius: "999px",
            overflow: "hidden",
            flex: 1,
          }}
       >
       <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: style.badge,
            borderRadius: "999px",
           transition: "width 0.3s ease",
          }}
        />
       </div>

        {/*status*/}
        <h3
        style={{ 
          fontSize: "12px", 
          textAlign:"left", }}>
          {subtitle}
        </h3>

        </div>

         <h3
        style={{ 
          fontSize: "11px", 
          color: "#555", 
          textAlign:"left",}}>
          ⏱ {timeLeft}
        </h3>

  
    
    </div>
  );
}

export default KPIItem;