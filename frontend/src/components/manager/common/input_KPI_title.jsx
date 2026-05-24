function InputKPITitle({ value, setValue }) {
  return (
    <div
      style={{
        textAlign: "start"
      }}
    >
      <h3 style={{ 
        fontSize:"16px",
        fontWeight: "bold" }}>KPI Title</h3>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter KPI title"
        style={{
          width: "100%",
          fontSize:"14px",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc"
        }}
      />
    </div>
  )
}

export default InputKPITitle