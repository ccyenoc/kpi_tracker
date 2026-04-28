import {LineChart,Line,XAxis,YAxis, Tooltip,CartesianGrid,Legend, ResponsiveContainer} from "recharts";
import {useEffect , useState} from "react";

function RectangleGraphCard(){
    {/* const [data, setData] = useState(); */}

     {/*useEffect( ()=> {
        fetch("https://localhost:8000/api/data")
        .then(res => res.json())
        .then(data => setData(data))
    },[] ); */}

     const data = [
    { time: "Week 1", kpi: 65, progress: 60, prediction: 68 },
    { time: "Week 2", kpi: 72, progress: 70, prediction: 75 },
    { time: "Week 3", kpi: 78, progress: 76, prediction: 80 },
    { time: "Week 4", kpi: 85, progress: 82, prediction: 88 }
  ];


    return(
        <div className="mx-3 mb-2"
        style={{
            display : "flex",
            flexGrow: 1,
            flexDirection: "column",
            height: "380px",
            padding: "20px",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            flex: "0 0 250px",  
            borderRadius : "15px",
            fontSize: "16px",
        }}>
            
            {/*} 
            backend connection
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" />
                </LineChart>
            </ResponsiveContainer>
            {*/}

            {/* frontend demonstration purpose */}
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
                  height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
           <LineChart data={data}>
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