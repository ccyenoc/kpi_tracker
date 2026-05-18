import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

function ProgressKPIGraph({ data }) {
  return (
    <div style={{ 
      marginTop: "20px",}}>

      <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>
        KPI Progress Over Time
      </h3>
      <p style={{ color: "#64748b", marginBottom: "10px" }}>
        Track performance trends
      </p>

      <div 
      style={{ 
        width: "900px", 
        maxWidth:"900px",
        height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            
            <CartesianGrid strokeDasharray="3 3" />
            
            <XAxis dataKey="week" />
            <YAxis />

            <Tooltip />

            {/* 🔵 Actual Progress */}
            <Line
              type="monotone"
              dataKey="progress"
              stroke="#2563eb"
              strokeWidth={2}
            />

            {/* 🟢 Prediction */}
            <Line
              type="monotone"
              dataKey="prediction"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <Legend />

          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default ProgressKPIGraph;