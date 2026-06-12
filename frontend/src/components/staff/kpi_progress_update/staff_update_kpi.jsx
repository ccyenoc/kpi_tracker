import { useEffect, useState } from "react";

const UpdateKpiModal = ({ kpi, onClose, onSubmit, history = []}) => {
  const [currentValue, setCurrentValue] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (kpi) {
      setCurrentValue(kpi.current || 0);
      setNotes("");
      setFiles([]);
      setError("");
      setIsSuccess(false);
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
  setError("");
  if (currentValue === "") {
    setError("Please enter current value");
    return;
  }

  if (Number(currentValue) < 0) {
    setError("Current value cannot be negative");
    return;
  }

  if (Number(currentValue) > Number(kpi.target)) {
    setError(`Current value cannot be more than target (${kpi.target})`);
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
    setIsSuccess(true);
  } catch (err) {
    console.error("Error submitting KPI update:", err);
    setError(err.message || "Failed to submit KPI progress.");
  }
};

  if (isSuccess) {
    return (
      <div style={overlayStyle}>
        <div style={{
          ...modalStyle,
          textAlign: "center",
          padding: "40px 30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          border: "none",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        }}>
          <div style={{
            width: "70px",
            height: "70px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #4ade80, #22c55e)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 10px 20px rgba(34, 197, 94, 0.3)"
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          
          <div>
            <h3 style={{
              fontSize: "22px",
              fontWeight: "bold",
              color: "#1f2937",
              margin: "0 0 8px 0"
            }}>Submission Successful!</h3>
            <p style={{
              fontSize: "14px",
              color: "#4b5563",
              lineHeight: "1.5",
              margin: 0
            }}>
              Your progress update for <strong>{kpi.title}</strong> has been successfully submitted and is awaiting verification.
            </p>
          </div>

          <button
            onClick={() => {
              setIsSuccess(false);
              onClose();
            }}
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "12px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "600",
              fontSize: "15px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.2)"
            }}
          >
            Okay, got it
          </button>
        </div>
      </div>
    );
  }

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
             fontSize:"16px",
             marginBottom: "15px" }}>
          Update your progress for: {kpi.title}
        </p>

        {/* Error Alert Box */}
        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "8px",
            padding: "10px 14px",
            color: "#b91c1c",
            fontSize: "14px",
            marginBottom: "15px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <div style={{ flex: 1 }}>{error}</div>
            <span 
              style={{ cursor: "pointer", fontWeight: "bold", opacity: 0.7 }} 
              onClick={() => setError("")}
            >
              ✕
            </span>
          </div>
        )}

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