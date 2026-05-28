import KPIAssignedListTable from "./kpi_assigned_list/kpi_assigned_list_table";

<<<<<<< HEAD:frontend/src/components/manager/kpi_management/kpi_assigned_list.jsx
function KPIAssignedListCard({data, users = []}){
  console.log("KPIAssignedListCard loaded with data:", data, "users:", users);
=======
function KPIAssignedListCard({data}){
  console.log("KPIAssignedListCard loaded with data:", data);
>>>>>>> 7aecd0edd3a2ad7f9b3e5363b8049b5176e10d23:frontend/src/components/kpi_assigned_list.jsx

    return(
        <div 
          className="d-flex mx-3 mb-2 flex-grow-1"
          style={{
            borderRadius:"15px",
            flexDirection:"column",
            padding:"20px",
            boxShadow:"0 4px 6px rgba(0, 0, 0, 0.1)",
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

          <KPIAssignedListTable data={data} users={users} />
        </div>
    )
}

export default KPIAssignedListCard;