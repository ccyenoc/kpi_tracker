import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

function Deadline({ value, setValue }) {
  const [date, setDate] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      
      <h3 style={{ fontSize: "16px", fontWeight: "bold", textAlign: "start" }}>
        Deadline
      </h3>

      <DatePicker
        selected={value}
        value={value}
        onChange={(date) => setValue(date)}
        placeholderText="Select deadline"
        dateFormat="dd / MM / yyyy"
        className="form-control"
      />

    </div>
  );
}

export default Deadline;