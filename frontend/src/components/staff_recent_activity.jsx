import {LineChart,Line,XAxis,YAxis, Tooltip,CartesianGrid,Legend, ResponsiveContainer} from "recharts";
import {useEffect , useState} from "react";
import { activityLogs, getTimeAgo } from "../data/activityLog";
import StaffRecentActivityCard from "./staff_recent_activity_card";

function StaffRecentActivity({userActivities}){
   return(
     <div
       className="d-flex"
       style={{
        marginTop:"20px",
        width:"98%",
        padding:"20px",
        borderRadius:"12px",
        flexDirection:"column",
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
       }}>

        {/*title and subtitle*/}
         <h3
              style={{
                fontSize:"16px",
                textAlign:"start",
                margin:"0px",
              }}>Recent Activity</h3>
              <h3
              style={{
                fontSize:"14px",
                margin:"0px",
                textAlign:"start",
                marginBottom:"20px",
                color: "#64748b",
              }}>Lastest Update</h3>

        {/*activites*/}
       {userActivities.map(activity => (
        <StaffRecentActivityCard
         key={activity.id}
         title={activity.title}
         action={activity.action}
         time={getTimeAgo(activity.createdAt)}
        />
))}

     </div> 
   )
}

export default StaffRecentActivity;