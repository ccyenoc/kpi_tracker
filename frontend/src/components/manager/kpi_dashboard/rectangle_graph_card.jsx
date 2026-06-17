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

import {
  useEffect,
  useState
} from "react";

import { kpi } from "../../../api/api";

function RectangleGraphCard() {

  const [data, setData] = useState([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {
    kpi.fetchKPIHistory()
      .then((result) => {
        console.log("KPI History:", result);
        setData(result.chart || []);
      })
      .catch((error) => {
        console.error("Error fetching KPI history:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {

    return (

      <div>
        Loading...
      </div>

    );

  }



  return (

    <div
      className="mx-3 mb-2 flex-grow-1"
      style={{
        height: "400px",
        padding: "20px",
        background: "#fff",
        borderRadius: "15px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >

      <h4
        style={{
          fontSize: "20px",
        }}>
        KPI Progress Over Time
      </h4>

      <h5
        style={{
          color: "#888",
          fontSize: "14px",
        }}
      >
        Actual vs Forecast
      </h5>



      <div
        style={{
          width: "100%",
          height: "300px"
        }}
      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart data={data} >

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="time" />

            <YAxis domain={[0, 100]} />

            <Tooltip />

            <Legend />

            <Line
              type="monotone"
              dataKey="progress"
              stroke="#f59e0b"
              name="Actual"
            />



            <Line
              type="monotone"
              dataKey="prediction"
              stroke="#10b981"
              strokeDasharray="5 5"
              name="Forecast"
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}


export default RectangleGraphCard;