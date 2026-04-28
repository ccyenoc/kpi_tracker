import { useState, useRef } from "react";

function ProgressDeadline({date}){
    const box = {
      padding: "10px 16px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      cursor: "pointer",
      background: "#fff",
      minWidth: "60px",
      fontSize:"14px",
      textAlign: "center"
}


  const [year, month, day] = date
    ? date.split("-")
    : ["YYYY", "MM", "DD"];


  return(
     <div
       className="d-flex"
       style={{
         flexDirection:"column"
       }}>

         <h3 style={{ 
        fontSize:"16px",
        fontWeight: "bold",
        textAlign:"start", }}>Deadline</h3>
        <div
        className="d-flex"
        style={{
          flexDirection: "row",
          gap: "10px" 
        }}
      >

        <div style={box}>{day}</div>
        <div style={box}>{month}</div>
        <div style={box}>{year}</div>

      </div>


     </div>
  )
}

export default ProgressDeadline