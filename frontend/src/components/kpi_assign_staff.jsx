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

const [searchTerm, setSearchTerm] = useState("");

const filteredStaff = staffList.filter(
  (staff) =>
    staff.role === "staff" &&
    (
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
);

const [selectedStaff, setSelectedStaff] = useState([]);

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
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="  Search Staff... "
              style={{
                textAlign:"start",
                fontSize:"14px",
                padding: "10px",
                borderRadius:"10px",
                border: "1px solid #ccc",
                outline: "none", }}
            />

            {searchTerm && (
  <div
    style={{
      border: "1px solid #eee",
      borderRadius: "10px",
      marginTop: "5px",
      background: "#fff",
      position: "relative",
      zIndex: 10
    }}
  >
    {filteredStaff.map((staff) => (
      <div
        key={staff.id}
        style={{
          padding: "8px",
          cursor: "pointer",
          borderBottom: "1px solid #eee"
        }}
        onClick={() => {
          if (!selectedStaff.find(s => s.id === staff.id)) {
            setSelectedStaff([
              ...selectedStaff,
              { ...staff, kpi: 0 }
            ]);
          }
          setSearchTerm("");
        }}
      >
        {staff.name} ({staff.email})
      </div>
    ))}
  </div>
)}

       </div>

       <div
  className="d-flex"
  style={{
    borderRadius: "15px",
    flexDirection: "column",
    padding: "20px",
    marginTop:"20px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    width: "100%",
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

  {selectedStaff.length === 0 ? (
  <div
    style={{
      padding: "20px",
      textAlign: "center",
      color: "#999",
      fontSize: "14px"
    }}
  >
    No staff assigned yet
  </div>
) : selectedStaff.map((staff) => (
  <div
    key={staff.id}
    style={{
      ...gridStyle,
      padding: "15px 0",
      borderBottom: "1px solid #eee",
      position: "relative"
    }}
  >
     <span
    onClick={() => {
      setSelectedStaff(selectedStaff.filter(s => s.id !== staff.id));
    }}
    style={{
      position: "absolute",
      top: "6px",
      right: "8px",
      cursor: "pointer",
      fontWeight: "bold",
      color: "#999"
    }}
  >
    ✕
  </span>

    {/* Staff */}
    <div>
      <strong>{staff.name}</strong><br />
      <span style={{ color: "#666", fontSize: "13px" }}>
        {staff.email}
      </span>
    </div>

    {/* KPI input */}
    <input
      type="number"
      value={staff.kpi}
      onChange={(e) => {
        const updated = selectedStaff.map(s =>
          s.id === staff.id
            ? { ...s, kpi: Number(e.target.value) }
            : s
        );
        setSelectedStaff(updated);
      }}
      style={{
        width: "80px",
        padding: "6px",
        borderRadius: "6px",
        border: "1px solid #ccc"
      }}
    />

    {/* Unit */}
    <div>{unit}</div>

    {/* Suggestion */}
    <div
      style={{
        background: "#fff7cc",
        border: "1px solid #facc15",
        padding: "10px",
        borderRadius: "10px",
        fontSize: "13px"
      }}
    >
      <strong>💡 50 {unit}</strong>
      <div style={{ fontSize: "0.75rem", color: "#555" }}>
        based on performance
      </div>
    </div>

  </div>
))}

</div>
    </div>

  );
}

export default KPIAssignStaff