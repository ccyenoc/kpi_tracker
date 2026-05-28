import StaffKPICard from "./staff_kpi_card"
import { useState } from "react";

const StaffKPIAssignedCard = ({ kpis = [], onUpdate}) =>{

    const [statusFilter, setStatusFilter] = useState("All");

    const filteredKPIs =
     statusFilter === "All"
     ? kpis
     : kpis.filter(kpi => kpi.status === statusFilter);

    return (
  <div
    className="d-flex"
    style={{
        flexDirection:"column",
        margin:"0px",
        width: "100%"
    }}>

        {/*title and subtitle*/}
        <div
          className="d-flex"
          style={{
            padding:"20px",
            flexDirection:"column",
             backgroundColor: "#ffffff",
             boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
             borderRadius: "15px",
             minHeight: "400px",  
             width: "100%",
             height: "500px",     
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h3
                    style={{
                        fontSize:"16px",
                        textAlign:"start",
                        margin:"0px",
                    }}>KPI Assigned</h3>
                    <h3
                    style={{
                        fontSize:"14px",
                        margin:"0px",
                        textAlign:"start",
                        marginBottom:"20px",
                        color: "#64748b",
                    }}>KPIs assigned are shown below</h3>
                </div>
                
                <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ 
                    borderRadius: "8px", 
                    border: "1px solid #e2e8f0", 
                    padding: "4px 8px", 
                    fontSize: "12px" }}>
                    <option value="All">All</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="at_risk">At Risk</option>
                    <option value="underperformed">Underperformed</option>
                </select>
            </div>

            <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "12px",
                overflowY: "auto",
                height: "400px",  
            }}>
                {filteredKPIs && filteredKPIs.length > 0 ? (
                    filteredKPIs.map ((item, index) =>(
                        <StaffKPICard  key={item.id || index}  kpi={item} onUpdate={onUpdate} />
                    ))
                ) : (
                    <p style={{ textAlign: "center", color: "#64748b", fontSize: "14px", marginTop: "20px" }}>
                        No KPIs assigned
                    </p>
                )}
            </div>

        </div>


    </div>
    )
}

export default StaffKPIAssignedCard