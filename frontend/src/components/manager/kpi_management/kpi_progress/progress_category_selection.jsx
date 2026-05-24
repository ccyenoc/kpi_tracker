function ProgressCategorySelection({category}) {
  const displayName = category?.name || category?.categoryName || "No category selected";
  console.log("State Category", category);
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

      <h3 style={{ 
        fontSize:"14px",}}>
        {displayName}
      </h3>


    </div>
  )
}

export default ProgressCategorySelection