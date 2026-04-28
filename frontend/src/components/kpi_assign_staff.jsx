import { useState } from "react";

function KPIAssignStaff({ staffList, unit }) {

    const [kpiValue, setKpiValue] = useState(100)

    const gridStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 2fr",
  alignItems: "center",
  gap: "10px",
  textAlign:"start",
  fontSize:"14px",
};

    return (
     <div
       className="d-flex"
       style={{
        flexDirection:"column"
       }}>
       
       {/*choose staff*/}
       <div
         className="d-flex"
         style={{
          
         flexDirection:"column"}}>
             <h3 
             style={{ 
              fontSize:"16px",
              fontWeight: "bold",
              textAlign:"start", }}>Assign Staff</h3>

            <input
              type ="text"
              placeholder="  Search Staff... "
              style={{
                textAlign:"start",
                fontSize:"14px",
                padding: "10px",
                borderRadius:"10px",
                border: "1px solid #ccc",
                outline: "none", }}
            />

       </div>

       <div
  className="d-flex"
  style={{
    borderRadius: "15px",
    flexDirection: "column",
    padding: "20px",
    marginTop:"20px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    width: "155%",
  }}
>

  {/* TABLE HEADER */}
  <div
    style={{
      ...gridStyle,
       fontSize:"16px",
      fontWeight: "bold",
      paddingBottom: "10px",
      borderBottom: "1px solid #eee"
    }}
  >
    <div>Staff</div>
    <div>KPI</div>
    <div>Unit</div>
    <div></div>

  </div>

  {/* ROW */}
  <div style={{ ...gridStyle, padding: "15px 0", borderBottom: "1px solid #eee" }}>

  {/* Staff */}
  
    {staffList.map((staff) => (
  <div
    key={staff.id}
  >
    {/* Staff */}
    <div>
      <strong>{staff.name}</strong><br />
      <span style={{ 
        color: "#666", 
        fontSize: "14px" }}>
        {staff.email}
      </span>
    </div>
  </div>
))}

  {/* KPI */}
  <input
    type="number"
    value={kpiValue}
    onChange={(e) => setKpiValue(Number(e.target.value))}
    style={{
      width: "80px",
      padding: "6px",
      borderRadius: "6px",
      border: "1px solid #ccc"
    }}
  />

  {/* Unit */}
  <div>units</div>

  {/* ✅ Suggestion (NOW BESIDE UNIT) */}
  <div
    style={{
      background: "#fff7cc",
      border: "1px solid #facc15",
      padding: "10px",
      borderRadius: "10px",
      fontSize: "13px"
    }}
  >
    <strong>💡 50 units</strong>
    <div style={{ fontSize: "0.75rem", color: "#555" }}>
      based on performance
    </div>
  </div>

</div>

</div>
    </div>

  );
}

export default KPIAssignStaff