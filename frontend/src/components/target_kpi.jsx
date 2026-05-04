function TargetKPISelection({ unit, setUnit, target, setTarget }){

    return(
        <div
         className="d-flex"
         style={{
            flexDirection:"column"
         }}>

             <h3 style={{ 
        fontSize:"16px",
        fontWeight: "bold",
        textAlign:"start" }}>Target KPI</h3>

            {/*kpi and unit*/}
            <div
              className="d-flex"
              style={{
                flexDirection:"row",
                fontSize:"14px",
                gap:"30px",
              }}>
                <input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  placeholder="Enter KPI"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #ccc"
                  }}
                />

                <select
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)} 
                  style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  background: "#fff",
                  cursor: "pointer",
                  fontSize:"14px",
                  color: "#333"
                 }}>

                   <option value="">Select Unit</option>
                   <option value="RM">RM</option>
                   <option value="%">%</option>
                   <option value="units">units</option>
                   <option value="days">days</option>
                   <option value="months">months</option>
            
                </select>
            </div>
         </div>
    )
}

export default TargetKPISelection