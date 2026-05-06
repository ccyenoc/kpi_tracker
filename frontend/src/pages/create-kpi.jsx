import PageTitle from "../components/page_title"
import InputKPITitle from "../components/input_KPI_title"
import CategorySelection from "../components/category_selection"
import { useState } from "react";
import TargetKPISelection from "../components/target_kpi"
import Deadline from "../components/deadline"
import KPIAssignStaff from "../components/kpi_assign_staff"
import TopBreadcrumb from "../components/top_breadcrumb";
import Description from "../components/description";
import { users } from "../data/userData";

function CreateKPI(){
    const [category, setCategory] = useState("")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [unit, setUnit] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [target, setTarget] = useState("");
    const [deadline, setDeadline] = useState(null);
    const [assignedStaff, setAssignedStaff] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const resetForm = () => {
  setTitle("");
  setDescription("");
  setCategory("");
  setUnit("");
  setTarget("");
  setDeadline(null);
  setAssignedStaff([]);
  setErrorMessage("");
};

  const KPI_TEMPLATES = {
    sales: ["Monthly Sales Revenue", "Closed Deals", "Conversion Rate"],
    lead: ["New Leads", "Cost per Lead", "Qualified Leads"],
    property: ["Occupancy Rate", "Tenant Retention", "Maintenance Response Time"],
    marketing: ["Campaign Conversion Rate", "CTR", "Traffic Growth"],
    customer: ["CSAT", "NPS", "Response Time"]
  }

  const handleConfirm = () => {
  if (!title.trim()) {
    setErrorMessage("KPI title is required");
    return;
  }

  if (!description.trim()) {
    setErrorMessage("KPI description is required");
    return;
  }

  if (!category) {
    setErrorMessage("Please select a category");
    return;
  }

  if (!target || Number(target) <= 0) {
    setErrorMessage("Please enter a valid target KPI");
    return;
  }

  if (!unit) {
    setErrorMessage("Please select a unit");
    return;
  }

  if (!deadline) {
    setErrorMessage("Please select a deadline");
    return;
  }

  if (assignedStaff.length === 0) {
    setErrorMessage("Please assign at least one staff");
    return;
  }

  setErrorMessage("");

  setShowModal(true);
}

  
    return(
      <div>
          
        <div 
          className="d-flex justify-content-center"
          style={{
            display: "flex",
            flexDirection : "column",
          }}>
        
            <PageTitle 
            title="Create KPI" 
            subtitle="Create a key performance indicator and assign to a staff"/>

            {errorMessage && (
  <div
    style={{
      backgroundColor: "#ffe5e5",
      color: "#d93025",
      padding: "10px",
      borderRadius: "8px",
      margin: "10px 20px"
    }}
  >
    {errorMessage}
  </div>
)}

        <div
          className="mx-3 mb-4 d-flex justify-content-center"
          style={{
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "start",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            padding: "24px",
            gap: "20px"
          }}>


          {/*title and category contanier*/}
          <div
            className="d-flex"
            style={{
              flexDirection: "row",
              font: "16px",
              gap: "400px",
            }}>

            <InputKPITitle value={title} setValue={setTitle} />
            <CategorySelection value={category} setValue={setCategory} />
          </div>

          <Description value={description} setValue={setDescription} />

          {/*kpi and deadline contanier*/}
          <div
            className="d-flex"
            style={{
              flexDirection: "row",
              font: "16px",
              gap: "260px",
            }}>

                <TargetKPISelection 
                  unit={unit} 
                  setUnit={setUnit}
                  target={target}
                  setTarget={setTarget}
                />
                <Deadline value={deadline} setValue={setDeadline} />
            </div>   
            <KPIAssignStaff 
              staffList={users} 
              unit={unit}
              assignedStaff={assignedStaff}
              setAssignedStaff={setAssignedStaff}
            />

            <div
                className="d-flex"
                style={{
                  marginTop: "20px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",    
                 gap: "50px",
                }}>
                <button
                  onClick={handleConfirm}
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

                   {showModal && (
        <div 
  className="modal show fade d-block"
  tabIndex="-1"
  style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 9999
  }}
>
          <div className="modal-dialog" 
          style={{ 
            marginTop:"15%",
            justifyContent: "center",
            display: "flex"
            }}>
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">KPI Created</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
  setShowModal(false);
  resetForm();
}}
                ></button>
              </div>

              <div className="modal-body">
                <p><strong>Title:</strong> {title}</p>
                <p><strong>Description:</strong> {description}</p>
                <p><strong>Category:</strong> {category}</p>
                <p><strong>Target:</strong> {target} {unit}</p>
                <p>
                 <strong>Deadline:</strong>{" "}
                {deadline ? deadline.toLocaleDateString() : "-"}
                </p>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
  setShowModal(false);
  resetForm();
}}
                >
                  OK
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

              </div>


        </div>



      </div>
    </div>


  )
}

export default CreateKPI