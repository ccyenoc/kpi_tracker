import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from "recharts";
import {useState} from "react";

const StaffMonthlyPerformanceGraph = ({ graphData, selectedMonth, setSelectedMonth }) =>{

    const safeData = graphData || [];

  const [search, setSearch] = useState("");

  const filteredData = safeData.filter(item => {
  const matchMonth =
  selectedMonth === "All" ||
  item.month === selectedMonth ||
  item.progress === 0; 
  const matchSearch = (item.name || "").toLowerCase().includes(search.toLowerCase());
  return matchMonth && matchSearch;
});

  return (
    <div
      className="d-flex"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",       
        width: "100%",
        padding: "16px",      
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius: "15px",
        boxSizing: "border-box",
        flex: 1,
        overflow: "hidden",
        position: "relative",
        zIndex: 1
      }}
    >

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px"
          }}>
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

        <div
        className="d-flex gap-2 mb-2"
        style={{ alignItems: "center" }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search KPI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "12px",
            flex: 1
          }}
        />

        {/* Month filter */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{
            padding: "6px 10px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "12px"
          }}
        >
          <option value="All">All</option>
          <option value="Jan">Jan</option>
          <option value="Feb">Feb</option>
          <option value="Mar">Mar</option>
          <option value="Apr">Apr</option>
        </select>
      </div>
      </div>

      {/* Chart */}
      <div style={{ 
        width: "100%", 
        height: "100%",
        flex: 1,
        minHeight: "250px",
        fontSize: "16px",
        textAlign:"start" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
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