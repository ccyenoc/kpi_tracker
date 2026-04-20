import {LineChart,Line,XAxis,YAxis, Tooltip,CartesianGrid,Legend, ResponsiveContainer} from "recharts";
import {useEffect , useState} from "react";

function RectangleGraphCard(){
    const [data, setData] = useState();

    useEffect( ()=> {
        fetch("https://localhost:8000/api/data")
        .then(res => res.json())
        .then(data => setData(data))
    },[] );

    return(
        <div 
        style={{
            display : "flex",
            height: "400px",
            padding: "20px",
            backgroundColor: "#ffffff",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            flex: "0 0 250px",  
            borderRadius : "15px",
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
            </div>



        </div>
    )
}

export default RectangleGraphCard;