function ExportBar(){
    const buttonStyle = {
  padding: "6px 12px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  backgroundColor: "#f9fafb",
  cursor: "pointer",
  fontSize: "14px",
  color: "#1E293B",
};

    return(
        <div 
        className="mx-3 mb-2"
        style={{
          display: "flex",
          flexGrow: 1,
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 12px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
        }}
      >
      {/* Left */}
      <p
        style={{
          fontSize: "16px",
          fontWeight: "500",
          color: "#374151"
        }}
      >
        Report Export
      </p>

      {/* Right */}
      <div style={{ 
        display: "flex", 
        gap: "10px" }}>
        <button style={buttonStyle}>Weekly Performance</button>
        <button style={buttonStyle}>Weekly Performance</button>
      </div>
    </div>
  );
    
}

export default ExportBar;