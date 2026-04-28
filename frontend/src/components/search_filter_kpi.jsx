function SearchFilterKPI(){
    const title = {
        fontWeight: "bold",
        textAlign: "left",
        fontSize: "14px"
    };

    const fieldStyle = {
         minHeight: "40px", 
         lineHeight: "40px", 
         height: "20px",       
         width: "230px",    
         padding: "0 12px",     
         fontSize: "14px",
         borderRadius: "15px",
         border: "1px solid #ccc",
         boxSizing: "border-box",
    };

    return(
        <div
          className="d-flex justify-content-center ms-3"
          style={{
            flexDirection:"column",
            boxShadow:"0 4px 6px rgba(0, 0, 0, 0.1)",
            borderRadius:"15px",
            width: "109%",
            padding:"20px",
          }}>
            <h2
              style={{
                textAlign:"left",
                fontSize:"16px",
              }}>Search and FIlter</h2>

             <div
          className="d-flex justify-item-center"
          style={{
            flexDirection:"row",
            width: "100%",
            gap:"30px",
          }}>

            <div 
              className="d-flex"
              style={{
                flexDirection:"column",
                textAlign:"left",
              }}>
            <p style={title}>Search KPI</p>
            <input
            type ="text"
            placeholder="  Search KPI... "
            style={fieldStyle}
            />
            </div>

            <div 
              className="d-flex"
              style={{
                flexDirection:"column",
                textAlign:"left",
              }}>
            <p style={title}>Search Staff</p>
            <input
            type ="text"
            placeholder="  Search Staff..."
            style={fieldStyle}
            />
            </div>
          
           <div 
              className="d-flex"
              style={{
                fontSize: "14px",
                flexDirection:"column",
                textAlign:"left",
              }}>
            <p style={title}>Filter Category</p>
            <select
             style={{
    ...fieldStyle,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  }}>
             <option value="">All Status</option>
             <option value="active">Active</option>
             <option value="completed">Completed</option>
             <option value="high">High Priority</option>
            </select>
            </div>

            <div 
              className="d-flex"
              style={{
                flexDirection:"column",
                textAlign:"left",
              }}>
            <p style={title}>Filter Status</p>
            <select
             style={{
    ...fieldStyle,
    appearance: "none",
    WebkitAppearance: "none",
    MozAppearance: "none",
  }}>
             <option value="">All Status</option>
             <option value="active">Active</option>
             <option value="completed">Completed</option>
             <option value="high">High Priority</option>
            </select>
            </div>
        </div>
        </div>

    )
}

export default SearchFilterKPI;