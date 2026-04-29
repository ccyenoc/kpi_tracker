import ManagerSidebar from "../components/manager_sidebar"
import PageTitle from "../components/page_title"
import InputKPITitle from "../components/input_KPI_title"
import CategorySelection from "../components/category_selection"
import { useState} from "react";
import TargetKPISelection from "../components/target_kpi"
import Deadline from "../components/deadline"
import KPIAssignStaff from "../components/kpi_assign_staff"
import TopBreadcrumb from "../components/top_breadcrumb";
import { users } from "../data/userData";

function CreateKPI(){
    const [category, setCategory] = useState("")
    const [title, setTitle] = useState("")
    const [unit, setUnit] = useState("");

    const KPI_TEMPLATES = {
    sales: ["Monthly Sales Revenue", "Closed Deals", "Conversion Rate"],
    lead: ["New Leads", "Cost per Lead", "Qualified Leads"],
    property: ["Occupancy Rate", "Tenant Retention", "Maintenance Response Time"],
    marketing: ["Campaign Conversion Rate", "CTR", "Traffic Growth"],
    customer: ["CSAT", "NPS", "Response Time"]
    }

    return(
      <div>
         <ManagerSidebar/>
            <TopBreadcrumb
  items={[
    { label: "KPI Management", path: "/kpi-management" },
    { label: "Create KPI" }
  ]}
/>
        <div 
          className="d-flex justify-content-center"
          style={{
            marginLeft: "150px",
            display: "flex",
            flexDirection : "column",
          }}>
        
            <PageTitle title="Create KPI" subtitle="Create a key performance indicator and assign to a staff"/>

        <div
           className="d-flex justify-content-center"
           style={{
            width : "109%",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "start",
              borderRadius:"12px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
              padding :"20px",
              gap:"20px"
,          }}>
          

            {/*title and category contanier*/}
            <div 
              className="d-flex"
              style={{
                flexDirection:"row",
                font:"16px",
                gap:"400px",
              }}>

                <InputKPITitle />
                <CategorySelection />
            </div>

            {/*kpi and deadline contanier*/}
            <div 
              className="d-flex"
              style={{
                flexDirection:"row",
                font:"16px",
                gap:"260px",
              }}>

                <TargetKPISelection unit={unit} setUnit={setUnit} />
                <Deadline />
            </div>   
            <KPIAssignStaff staffList={users} unit={unit} />

            <div
                className="d-flex"
                style={{
  marginTop: "20px",
  display: "flex",
  justifyContent: "center", // ✅ horizontal center
  alignItems: "center",     // ✅ vertical center
  gap: "50px",
}}>
                <button
                 style={{
                   width:"200px",      
                   backgroundColor: "#2b4cb3",
                   color: "#fff",
                   padding: "10px 20px",
                   border: "none",
                   borderRadius: "10px",
                   fontSize: "14px",
                   cursor: "pointer"}}>
                  Confirm</button>
              </div>


        </div>

  
      
        </div>
        </div>

        
    )
}

export default CreateKPI