function CategorySelection({ value, setValue }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign:"start",
      }}
    >
       <h3 style={{ 
        fontSize:"16px",
        fontWeight: "bold" }}>
        Category
      </h3>

      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          background: "#fff",
          cursor: "pointer",
          fontSize:"14px",
          color: "#333",
        }}
      >
         <option value="">Select category</option>
         <option value="sales">Sales Performance</option>
         <option value="lead">Lead Generation</option>
         <option value="property">Property Management</option>
         <option value="marketing">Marketing Performance</option>
         <option value="customer">Customer Experience</option>
      </select>
    </div>
  )
}

export default CategorySelection