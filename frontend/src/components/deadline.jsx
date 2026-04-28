import { useState, useRef } from "react";

function Deadline(){
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

const [date, setDate] = useState("");
  const inputRef = useRef(null);

const openPicker = () => {
    inputRef.current?.showPicker?.();
    inputRef.current?.focus();
  };

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
          gap: "10px" // ✅ ADDED spacing
        }}
      >

        {/* ✅ REPLACED your empty fragment with clickable boxes */}
        <div onClick={openPicker} style={box}>{day}</div>
        <div onClick={openPicker} style={box}>{month}</div>
        <div onClick={openPicker} style={box}>{year}</div>

      </div>

      {/* ✅ ADDED: hidden real date input */}
      <input
        ref={inputRef}
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        style={{ 
          fontSize:"14px",
          display: "none" }}
      />


     </div>
  )
}

export default Deadline