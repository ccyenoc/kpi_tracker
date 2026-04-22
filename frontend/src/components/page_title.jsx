function PageTitle({title,subtitle}){
  return(
    <div 
              className = "d-flex"
              style={{
                display: "flex",
                flexDirection: "column",
                textAlign : "left",
                padding: "20px",
                width : "100%",
                font: "bold"
              }}>
                <h2>{title}</h2>
                <h3
                  style={{
                    fontSize: "13px", 
                    color: "#64748b",
                  }}>{subtitle}</h3>
            </div>
  )
}

export default PageTitle