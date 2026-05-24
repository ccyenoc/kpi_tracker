function ProgressInputKPITitle({title}) {
  return (
    <div
      style={{
        textAlign: "start"
      }}
    >
      <h3 style={{ 
        fontSize:"16px",
        fontWeight: "bold" }}>KPI Title</h3>

      <h3
        style={{
          fontSize:"14px",
        }}>{title}</h3>
    </div>
  )
}

export default ProgressInputKPITitle