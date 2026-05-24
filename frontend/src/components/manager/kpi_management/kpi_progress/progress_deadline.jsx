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

  // Parse date - handle both ISO format (2026-09-25T16:00:00.000Z) and simple format (2026-09-25)
  let year = "YYYY", month = "MM", day = "DD";
  if (date) {
    try {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        year = dateObj.getFullYear().toString();
        month = String(dateObj.getMonth() + 1).padStart(2, "0");
        day = String(dateObj.getDate()).padStart(2, "0");
      }
    } catch (e) {
      // If parsing fails, try simple split
      const parts = date.split("-");
      if (parts.length >= 3) {
        year = parts[0];
        month = parts[1];
        day = parts[2].split("T")[0]; // Handle ISO format
      }
    }
  }


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