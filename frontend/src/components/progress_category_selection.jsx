function ProgressCategorySelection({category}) {
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
        {category.name}
      </h3>


    </div>
  )
}

export default ProgressCategorySelection