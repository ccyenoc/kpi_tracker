import KPIItem from "./kpi-item";

function KpiCard({ title, subtitle, items = [] }) {
  return (
    <div
      style={{
        height: "100%",
        width: "600px",
        background: "#ffffff",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h5 style={{ 
        fontSize: "16px", 
        textAlign: "left"
         }}>{title} </h5>

      <p 
        style={{ 
            fontSize: "13px", 
            color: "#64748b",
            textAlign: "left",
            }}>{subtitle}</p>

      <div 
        style={{ marginTop: "10px" }}>
        {items.map((item, index) => (
          <KPIItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
}

export default KpiCard;