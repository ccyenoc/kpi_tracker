function ProgressTargetKPISelection({kpi,unit}){

  console.log("Kpi:" ,kpi);
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

         <div
         className="d-flex"
         style={{
            flexDirection:"row",
            gap:"20px",
         }}>
            {/*kpi and unit*/}
             <h3
               style={{
                fontSize:"14px",
               }}>{kpi}</h3>

               <h3
               style={{
                fontSize:"14px",
               }}>{unit}</h3>
            </div>
            </div>

    )
}

export default ProgressTargetKPISelection