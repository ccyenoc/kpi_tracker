// this is the basic card layout
function Card({ title, value, subtitle, color }) {
  return (
    <div
      style={{
        flex: "0 0 250px",  
        border: `2px solid ${color}`,
        borderRadius: "12px",
        borderLeft: `6px solid ${color}`, // this is where we make the border thicker on the left to make it prettier
        padding: "12px",
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Top title */}
      <div style={{ 
        fontSize: "14px", 
        color: "#374151" }}>{title}
      </div>

      {/* Big number */}
      <div style={{ 
        fontSize: "28px", 
        fontWeight: "bold", 
        marginTop: "10px" }}>{value}
      </div>

      {/* Subtitle */}
      <div style={{ 
        fontSize: "13px", 
        color: "#6b7280", 
        marginTop: "5px" }}>{subtitle}
      </div>
    </div>
  );
}

// this is for the dashboard top cards layout (4 x 1)
function DashboardCards({ stats }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "0 20px 20px",
      }}
    >
       {stats.map((item, index)=>(
          <Card
          key={index}
          title={item.title}
          value={item.value}
          subtitle={item.subtitle}
          color={item.color}
          />
       ))}
    
    </div>
  );
}
export default DashboardCards;
     