function ProgressKPIPrediction({ prediction }) {
  if (!prediction) return null;

  return (
    <div style={{ marginBottom: "20px" }}>

      {/* Title */}
      <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>
        KPI Progress Prediction
      </h3>
      <p style={{ color: "#64748b", marginBottom: "12px" }}>
        Prediction of KPI Status
      </p>

      {/* ✅ OVERALL STATUS */}
      {prediction.overall && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: "#dcfce7",
          border: "1px solid #86efac",
          padding: "12px",
          borderRadius: "10px",
          marginBottom: "10px"
        }}>
          <span style={{ fontSize: "18px" }}>✅</span>
          <span style={{ fontSize: "14px", fontWeight: "500" }}>
            {prediction.overall}
          </span>
        </div>
      )}

      {/* ⚠️ WARNINGS LIST */}
      {prediction.warnings && prediction.warnings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          
          {prediction.warnings.map((warn, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "#fef9c3",
                border: "1px solid #facc15",
                padding: "12px",
                borderRadius: "10px"
              }}
            >
              <span style={{ fontSize: "18px" }}>⚠️</span>
              <span style={{ fontSize: "14px" }}>
                {warn}
              </span>
            </div>
          ))}

        </div>
      )}

      {/* ❌ No warnings fallback */}
      {(!prediction.warnings || prediction.warnings.length === 0) && (
        <div style={{
          fontSize: "13px",
          color: "#94a3b8",
          marginTop: "5px"
        }}>
          No risks detected 🎉
        </div>
      )}

    </div>
  );
}

export default ProgressKPIPrediction;