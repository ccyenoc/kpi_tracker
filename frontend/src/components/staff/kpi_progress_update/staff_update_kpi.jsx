import { useEffect, useState } from "react";

const UpdateKpiModal = ({ kpi, onClose, onSubmit, history = []}) => {
  const [currentValue, setCurrentValue] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (kpi) {
      setCurrentValue(kpi.current || 0);
      setNotes("");
      setFiles([]);
    }
  }, [kpi]);

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

const handleSubmit = async () => {
  if (currentValue === "") {
    alert("Please enter current value");
    return;
  }

  if (Number(currentValue) < 0) {
    alert("Current value cannot be negative");
    return;
  }

  if (Number(currentValue) > Number(kpi.target)) {
    alert(`Current value cannot be more than target (${kpi.target})`);
    return;
  }

  try {
    const formData = new FormData();

    formData.append("kpiId", kpi.id);
    formData.append("current", Number(currentValue));
    formData.append("notes", notes);

    files.forEach((file) => {
      formData.append("files", file);
    });

    await onSubmit(formData);

    alert("Submission successful!");
    onClose();
  } catch (err) {
    console.error("Error submitting KPI update:", err);
    alert(err.message || "Failed to submit KPI progress.");
  }
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
            type="number"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Upload */}
        <div style={uploadBox}>
          ⬆ Drag & drop files here<br/>

          {files.length > 0 && (
            <div style={{ fontSize: "13px", color: "#475569" }}>
              {files.map((file, index) => (
                <p key={index} style={{ margin: "4px 0" }}>
                  Selected: {file.name}
                </p>
              ))}
            </div>
          )}

          <label
            style={{ 
              display: "inline-block",
              marginTop:"10px",
              padding:"10px",
              border:"none",
              borderRadius:"16px",
              background: "#2563eb", 
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              color: "#fff",
              cursor: "pointer"
            }}
          >
            Browse Files
            <input
              type="file"
              multiple
              hidden
              onChange={(e) => setFiles(Array.from(e.target.files))}
            />
          </label>

        </div>

        {/* Notes */}
        <textarea
          placeholder="Add notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={inputStyle}
        />

        
        {history.length > 0 && (
          <div
            style={{
              marginTop: "10px",
              marginBottom: "10px",
              maxHeight: "130px",
              overflowY: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "10px",
              fontSize: "13px",
            }}
          >
            <strong>Submission History</strong>

            {[...history].reverse().map((item) => (
              <div
                key={item.id}
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "8px",
                  marginTop: "8px",
                }}
              >
                <div>Progress: {item.current}</div>
                <div>
                  Evidence:{" "}
                  {item.fileNames?.length > 0
                    ? item.fileNames.join(", ")
                    : "No file"}
                </div>
                <div>Submitted: {item.submittedAt}</div>
              </div>
            ))}
          </div>
        )}

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
          type="button"
          onClick={handleSubmit}
          style={{ 
            border:"none",
            borderRadius:"16px",
            background: "#2563eb", 
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            color: "#fff",
            cursor: "pointer"}}>
            Submit Update
          </button>
        </div>

      </div>
    </div>
  );
};

export default UpdateKpiModal