import StaffKPICard from "./staff_kpi_card"

const StaffKPIAssignedCard = ({ kpis }) =>{
    return (
  <div
    className="d-flex"
    style={{
        flexDirection:"column",
        margin:"0px",
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
             height: "320px",  
             width:"490px",
          }}>
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



              {kpis.map ((kpis,index) =>(
                <StaffKPICard key={index} kpi={kpis} />
              ))}

        </div>


    </div>
    )
}

export default StaffKPIAssignedCard