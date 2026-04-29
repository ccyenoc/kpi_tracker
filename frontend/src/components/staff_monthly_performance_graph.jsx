import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer   // ✅ THIS LINE IS MISSING
} from "recharts";

const StaffMonthlyPerformanceGraph = () => {
  const data = [
    { time: "Week 1", kpi: 65, progress: 60, prediction: 68 },
    { time: "Week 2", kpi: 72, progress: 70, prediction: 75 },
    { time: "Week 3", kpi: 78, progress: 76, prediction: 80 },
    { time: "Week 4", kpi: 85, progress: 82, prediction: 88 }
  ];

  return (
    <div
      className="d-flex"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "320px",       
        width: "50%",
        padding: "16px",      
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius: "15px",
      }}
    >
      {/* Header */}
      <div 
      style={{ marginBottom: "10px" }}>
        <h4 style={{ fontSize: "16px", marginBottom: "4px" }}>
          Monthly Performance
        </h4>
        <h5 style={{ color: "#8a8a8a", fontSize: "13px" }}>
          KPI completion vs target over time
        </h5>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: "200px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="2 2" />

            <XAxis dataKey="time" />
            <YAxis />

            <Tooltip />
            <Legend verticalAlign="top" align="right" />

            <Line strokeWidth={2} type="monotone" dataKey="kpi" stroke="#2563eb" name="Assigned KPI" />
            <Line strokeWidth={2} type="monotone" dataKey="progress" stroke="#f59e0b" name="Progress" />
            <Line strokeWidth={2} type="monotone" dataKey="prediction" stroke="#10b981" name="Prediction" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StaffMonthlyPerformanceGraph;