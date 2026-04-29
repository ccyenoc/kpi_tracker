const UpdateKpiModal = ({ kpi, onClose }) => {
  if (!kpi) return null;

  const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  fontSize:"16px",
};

const modalStyle = {
  background: "#fff",
  padding: "25px",
  borderRadius: "16px",
  width: "400px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
  fontSize:"16px",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  marginBottom: "10px",
  borderRadius: "8px",
  border: "1px solid #2563eb",
  fontSize:"16px",
};

const uploadBox = {
  border: "1px dashed #2563eb",
  padding: "20px",
  textAlign: "center",
  borderRadius: "10px",
  marginBottom: "10px",
  fontSize:"16px",
};

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Header */}
        <div 
        style={{ 
            display: "flex", 
            alignItems:"center",
            justifyContent: "space-between", }}>
          <h2
            style={{
                fontSize:"23px",
            }}>Update KPI Progress</h2>
          <span style={{ cursor: "pointer" }} onClick={onClose}>✕</span>
        </div>

        <p style={{
             fontWeight:"bold",
             color: "#6b7280",
             fontSize:"16px", }}>
          Update your progress for: {kpi.title}
        </p>

        {/* Input */}
        <div>
          <label>Current Value *</label>
          <input
            defaultValue={kpi.current}
            style={inputStyle}
          />
        </div>

        {/* Upload */}
        <div style={uploadBox}>
          ⬆ Drag & drop files here<br/>
          <button 
          style={{ 
            marginTop:"10px",
            padding:"10px",
            border:"none",
            borderRadius:"16px",
            background: "#2563eb", 
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            color: "#fff" }}>Browse Files</button>
        </div>

        {/* Notes */}
        <textarea
          placeholder="Add notes..."
          style={inputStyle}
        />

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button 
          onClick={onClose}
          style={{
            padding:"10px",
            border:"none",
            borderRadius:"16px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            color:"#2563eb",}}>Cancel</button>
          <button 
          style={{ 
            border:"none",
            borderRadius:"16px",
            background: "#2563eb", 
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            color: "#fff" }}>
            Submit Update
          </button>
        </div>

      </div>
    </div>
  );
};

export default UpdateKpiModal