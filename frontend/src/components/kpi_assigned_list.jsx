import KPIAssignedListTable from "./kpi_assigned_list_table";

function KPIAssignedListCard({data}){

    return(
        <div 
          className="d-flex m-3"
          style={{
            borderRadius:"15px",
            flexDirection:"column",
            padding:"20px",
            boxShadow:"0 4px 6px rgba(0, 0, 0, 0.1)",
            width: "109%",
          }}>

          <div 
            className="d-flex"
            style={{
                textAlign:"left",
                flexDirection:"column",
            }}>
            <h2
             style={{
                fontSize:"16px",
             }}>KPI List</h2>
            <h4
             style={{
                color: "#64748b",
                fontSize:"13px",
             }}>View and manage all key performance indicators</h4>
          </div>

          <KPIAssignedListTable data={data} />
        </div>
    )
}

export default KPIAssignedListCard;