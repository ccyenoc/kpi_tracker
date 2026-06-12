function ProgressKPIPrediction({ overallPredictedProgress, daysRemaining, staffPredictions }) {
  if (overallPredictedProgress === undefined || overallPredictedProgress === null) return null;

  // Compute overall status message
  let overall = "";
  if (overallPredictedProgress >= 80) {
    overall = `Overall KPI status is On Track! (Prediction: ${overallPredictedProgress}%)`;
  } else if (overallPredictedProgress >= 50) {
    overall = `Overall KPI status is At Risk! (Prediction: ${overallPredictedProgress}%)`;
  } else {
    overall = `Overall KPI status is Off Track! (Prediction: ${overallPredictedProgress}%)`;
  }

  // Compute warnings list from staff predictions
  const warnings = [];
  if (staffPredictions && staffPredictions.length > 0) {
    staffPredictions.forEach(sp => {
      if (sp.predictedStatus === "At Risk") {
        warnings.push(`Staff member ${sp.staffName || sp.staffId} is At Risk (${sp.predictedProgress}%)`);
      } else if (sp.predictedStatus === "Off Track") {
        warnings.push(`Staff member ${sp.staffName || sp.staffId} is Off Track (${sp.predictedProgress}%)`);
      }
    });
  }

  const isGreen = overallPredictedProgress >= 80;
  const isYellow = overallPredictedProgress >= 50 && overallPredictedProgress < 80;

  return (
    <div style={{ width: "100%", marginBottom: "20px" }}>
      {/* Title */}
      <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>
        KPI Progress Prediction
      </h3>
      <p style={{ color: "#64748b", marginBottom: "12px" }}>
        Prediction of KPI Status ({daysRemaining} days remaining)
      </p>

      {/* ✅ OVERALL STATUS */}
      {overall && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: isGreen ? "#dcfce7" : isYellow ? "#fef9c3" : "#fee2e2",
          border: `1px solid ${isGreen ? "#86efac" : isYellow ? "#facc15" : "#fca5a5"}`,
          padding: "12px",
          borderRadius: "10px",
          marginBottom: "10px"
        }}>
          <span style={{ fontSize: "18px" }}>
            {isGreen ? "✅" : isYellow ? "⚠️" : "❌"}
          </span>
          <span style={{ fontSize: "14px", fontWeight: "500", color: isGreen ? "#15803d" : isYellow ? "#a16207" : "#b91c1c" }}>
            {overall}
          </span>
        </div>
      )}

      {/* ⚠️ WARNINGS LIST */}
      {warnings.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {warnings.map((warn, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                padding: "12px",
                borderRadius: "10px"
              }}
            >
              <span style={{ fontSize: "18px" }}>⚠️</span>
              <span style={{ fontSize: "14px", color: "#b91c1c", fontWeight: "500" }}>
                {warn}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 🎉 No warnings fallback */}
      {warnings.length === 0 && (
        <div style={{
          fontSize: "13px",
          color: "#22c55e",
          fontWeight: "500",
          marginTop: "5px"
        }}>
          No individual risks detected 🎉
        </div>
      )}
    </div>
  );
}

export default ProgressKPIPrediction;