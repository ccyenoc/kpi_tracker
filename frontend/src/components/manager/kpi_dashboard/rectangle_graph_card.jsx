import {LineChart,Line,XAxis,YAxis, Tooltip,CartesianGrid,Legend, ResponsiveContainer} from "recharts";
import {useEffect , useState} from "react";
import { kpi } from "../../../api/api";

function RectangleGraphCard(){
    console.log("RectangleGraphCard loaded");

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem("token");
      
      // Fetch real KPI performance data from backend
      kpi.fetchDashboardStats()
      .then(data => {
        if (data?.kpiTrends) {
          // Format backend data for the chart
          setData(data.kpiTrends.map(item => ({
            time: item.month || item.week || item.time,
            kpi: item.kpi || item.target || 0,
            progress: item.progress || item.current || 0,
            prediction: item.prediction || item.predictedProgress || 0
          })));
        } else {
          // Fallback data if endpoint doesn't return trends
          setData([
            { time: "Week 1", kpi: 65, progress: 60, prediction: 68 },
            { time: "Week 2", kpi: 72, progress: 70, prediction: 75 },
            { time: "Week 3", kpi: 78, progress: 76, prediction: 80 },
            { time: "Week 4", kpi: 85, progress: 82, prediction: 88 }
          ]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch graph data:", err);
        // Show fallback data on error
        setData([
          { time: "Week 1", kpi: 65, progress: 60, prediction: 68 },
          { time: "Week 2", kpi: 72, progress: 70, prediction: 75 },
          { time: "Week 3", kpi: 78, progress: 76, prediction: 80 },
          { time: "Week 4", kpi: 85, progress: 82, prediction: 88 }
        ]);
      })
      .finally(() => setLoading(false));
    }, []);


    return(
        <div className="mx-3 mb-2 flex-grow-1"
        style={{
            position: "relative",
            zIndex: 1,
            display : "flex",
            flexDirection: "column",
            height: "380px",
            padding: "20px",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            width: "97%", 
            borderRadius : "15px",
            fontSize: "16px",
        }}>
            
            <div
              style={{
                display : "flex",
                flexDirection :"column",
                alignItems : "flex-start",
                borderRadius : "15px",
              }}>
            <h4
            style={{
                fontSize: "18px",
              }}>KPI Progress Over Time</h4>
            <h5 style={{ 
                color: "#8a8a8a" ,
                fontSize : "14px"}}>Track KPI performance trends over time </h5>

                <div style={{ 
                  width: "100%", 
                  height: "300px",
                  overflow: "hidden"  }}>
          <ResponsiveContainer 
          width="100%" 
          height="100%">
           <LineChart 
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />

            <XAxis dataKey="time" />
            <YAxis />

            <Tooltip />
            <Legend verticalAlign="top" align="right" />

            {/* Blue */}
            <Line type="monotone" dataKey="kpi" stroke="#2563eb" name="Assigned KPI" />

            {/* Orange */}
            <Line type="monotone" dataKey="progress" stroke="#f59e0b" name="Progress" />

            {/* Green */}
            <Line type="monotone" dataKey="prediction" stroke="#10b981" name="Prediction" />
          </LineChart>
        </ResponsiveContainer>
      </div>

            </div>



        </div>
    )
}

export default RectangleGraphCard;