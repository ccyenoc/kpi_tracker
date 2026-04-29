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
  zIndex: 1000
};

const modalStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "16px",
  width: "400px",
  boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  marginBottom: "10px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb"
};

const uploadBox = {
  border: "2px dashed #d1d5db",
  padding: "20px",
  textAlign: "center",
  borderRadius: "10px",
  marginBottom: "10px"
};

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h2>Update KPI Progress</h2>
          <span style={{ cursor: "pointer" }} onClick={onClose}>✕</span>
        </div>

        <p style={{ color: "#6b7280" }}>
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
          <button style={{ marginTop: "10px" }}>Browse Files</button>
        </div>

        {/* Notes */}
        <textarea
          placeholder="Add notes..."
          style={inputStyle}
        />

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose}>Cancel</button>
          <button style={{ background: "#2563eb", color: "#fff" }}>
            Submit Update
          </button>
        </div>

      </div>
    </div>
  );
};

export default UpdateKpiModal