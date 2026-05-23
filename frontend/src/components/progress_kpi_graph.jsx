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

import { useEffect, useState } from "react";
import { fetchKPIPrediction } from "../api/api";

function ProgressKPIGraph({kpiId }) {

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

  console.log("kpiId =", kpiId);

  if (!kpiId) {
    setLoading(false);
    return;
  }

  async function loadGraph() {

    try {

      console.log("START REQUEST");

      setLoading(true);

      const result =
        await fetchKPIPrediction(
          kpiId
        );

      console.log(
        "RESULT:",
        result
      );

      setData(
        result.chart || []
      );

    }

    catch (err) {

      console.log(
        "ERROR:",
        err
      );

    }

    finally {

      console.log(
        "DONE"
      );

      setLoading(false);

    }

  }

  loadGraph();

}, [kpiId]);



  if (loading) {

  return (
    <div
      style={{
        padding: "40px",
        textAlign: "center"
      }}
    >
      Loading KPI graph...
    </div>
  );

}



return (

  <div
    style={{
      marginTop: "20px",
      width: "100%"
    }}
  >

    <h3
      style={{
        fontSize: "18px",
        fontWeight: "bold"
      }}
    >
      KPI Progress Over Time
    </h3>

    <p
      style={{
        color: "#64748b",
        marginBottom: "20px"
      }}
    >
      Expected vs Actual vs Forecast
    </p>


    <div
      style={{
        width: "100%",
        height: "350px"
      }}
    >

      <ResponsiveContainer
        width="100%"
        height="100%"
      >

        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 10
          }}
        >

          <CartesianGrid
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="time"
          />

          <YAxis
            domain={[0, 100]}
          />

          <Tooltip />

          <Legend
            verticalAlign="top"
          />


          <Line
            type="monotone"
            dataKey="kpi"
            stroke="#2563eb"
            strokeWidth={3}
            name="Expected"
          />


          <Line
            type="monotone"
            dataKey="progress"
            stroke="#f59e0b"
            strokeWidth={3}
            name="Actual"
          />


          <Line
            type="monotone"
            dataKey="prediction"
            stroke="#10b981"
            strokeWidth={3}
            strokeDasharray="5 5"
            name="Forecast"
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  </div>

);
}

export default ProgressKPIGraph;