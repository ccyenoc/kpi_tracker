import { util } from "../../../api/api";

function ExportBar({ onMonthlyReport }) {
  console.log("ExportBar loaded");

  const buttonStyle = {
    padding: "6px 12px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
    cursor: "pointer",
    fontSize: "14px",
    color: "#1E293B",
  };

  const weeklyReport = async () => {
    try {
      const blob = await util.getWeeklyReport();
      console.log("API DATA:", blob);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "weekly_report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url); // clean up the URL object
    } catch (err) {
      console.log("ERROR:", err);
    }
  };

  const monthlyReport = async () => {
    try {
      const blob = await util.getMonthlyReport();
      console.log("API DATA:", blob);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "monthly_report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url); // clean up the URL object
    } catch (err) {
      console.log("ERROR:", err);
    }
  };

  return (
    <div
      className="mx-3 mb-2 flex-grow-1"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
      }}
    >
      <p style={{ fontSize: "16px", fontWeight: "500", color: "#374151" }}>
        Report Export
      </p>

      <div style={{ display: "flex", gap: "10px" }}>
        <button style={buttonStyle} onClick={weeklyReport}>
          Weekly Performance
        </button>

        <button style={buttonStyle} onClick={monthlyReport}>
          Monthly Performance
        </button>
      </div>
    </div>
  );
}

export default ExportBar;