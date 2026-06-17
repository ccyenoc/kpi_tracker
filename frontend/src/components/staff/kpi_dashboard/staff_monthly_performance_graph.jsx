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

import { useState } from "react";


function StaffMonthlyPerformanceGraph({
  graphData,
  selectedMonth,
  setSelectedMonth
}) {

  const [search, setSearch] =
    useState("");


  const data = graphData || [];


  const filteredData = data.filter((item) => {
    const matchMonth = selectedMonth === "All" || item.month === selectedMonth;
    const matchSearch = (item.name || "").toLowerCase().includes(search.toLowerCase());
    return (matchMonth && matchSearch);
  });



  return (

    <div

      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "20px",
        backgroundColor: "#ffffff",
        borderRadius: "15px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}

    >



      {/* Header */}

      <div

        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"

        }}

      >

        <div>

          <h4
            style={{
              fontSize: "18px",
              marginBottom: "4px"
            }}
          >
            Monthly Performance
          </h4>


          <h5

            style={{
              color: "#8a8a8a",
              fontSize: "13px"
            }}

          >
            KPI completion vs target over time
          </h5>
        </div>



        <div
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "center"
          }}

        >


          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{
              padding: "8px",
              border: "1px solid #ddd",
              borderRadius: "8px"
            }}

          >

            <option value="All">
              All
            </option>

            <option value="Jan">
              Jan
            </option>

            <option value="Feb">
              Feb
            </option>

            <option value="Mar">
              Mar
            </option>

            <option value="Apr">
              Apr
            </option>

            <option value="May">
              May
            </option>

            <option value="Jun">
              Jun
            </option>

            <option value="Jul">
              Jul
            </option>

            <option value="Aug">
              Aug
            </option>

            <option value="Sep">
              Sep
            </option>

            <option value="Oct">
              Oct
            </option>

            <option value="Nov">
              Nov
            </option>

            <option value="Dec">
              Dec
            </option>

          </select>

        </div>

      </div>




      {/* Graph */}

      <div

        style={{

          width:
            "100%",

          flex:
            1,

          minHeight:
            "300px"

        }}

      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart
            data={filteredData}
            margin={{
              top: 20,
              right: 20,
              left: 0,
              bottom: 10
            }}

          >

            <CartesianGrid
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />

            <XAxis dataKey="time" />
            <YAxis domain={[0, 100]} />

            <Tooltip />

            <Legend
              verticalAlign="top"
              align="right"
            />



            <Line
              type="monotone"
              dataKey="kpi"
              stroke="#2563eb"
              strokeWidth={3}
              name="Assigned KPI"
            />



            <Line
              type="monotone"
              dataKey="progress"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Progress"
            />



            <Line
              type="monotone"
              dataKey="prediction"
              stroke="#10b981"
              strokeWidth={3}
              strokeDasharray="5 5"
              name="Prediction"
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}

export default StaffMonthlyPerformanceGraph;