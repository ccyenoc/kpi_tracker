function StaffSearchFilterKPI({ searchKPI, setSearchKPI, filterCategory, setFilterCategory, filterStatus, setFilterStatus}) {
    const title = {
        fontWeight: "bold",
        textAlign: "left",
        fontSize: "14px",
        marginBottom: "8px"
    };

    const fieldStyle = {
         height: "45px",       
         width: "100%",    
         padding: "0 12px",     
         fontSize: "14px",
         borderRadius: "8px",   // Adjusted border radius to 8px
         border: "1px solid #ccc",
         boxSizing: "border-box", 
         backgroundColor: "#fff",
         color: "black",
         outline: "none"
    };


    return(
        <div
          className="d-flex"
          style={{
            flexDirection:"column",
            boxShadow:"0 4px 6px rgba(0, 0, 0, 0.1)",
            borderRadius:"15px",
            width:"100%",
            padding:"25px",
            backgroundColor: "#fff"
          }}>
            <h2
              style={{
                textAlign:"left",
                fontSize:"16px",
                margin: "0 0 20px 0"
              }}>Search and Filter</h2>

             <div
          style={{
            display: "flex",
            flexDirection:"row",
            width: "100%",
            gap:"20px",
            alignItems: "flex-end" 
          }}>

            <div style={{ flex: 2, display: "flex", flexDirection:"column" }}>
                <p style={title}>Search KPI</p>
                <input
                value={searchKPI}
                    onChange={(e) => setSearchKPI(e.target.value)}
                    type ="text"
                    placeholder="Search KPI..."
                    style={fieldStyle}
                />
            </div>

          
           <div style={{ flex: 1, display: "flex", flexDirection:"column" }}>
                <p style={title}>Filter Category</p>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{
                        ...fieldStyle,
                        appearance: "auto", 
                    }}>
                    <option value="">All Categories</option>
                    <option value="Sales Performance">Sales Performance</option>
                    <option value="Lead Generation">Lead Generation</option>
                    <option value="Property Management">Property Management</option>
                    <option value="Marketing Performance">Marketing Performance</option>
                    <option value="Customer Experience">Customer Experience</option>
                </select>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection:"column" }}>
                <p style={title}>Filter Status</p>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        ...fieldStyle,
                        appearance: "auto",
                    }}>
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="at_risk">At Risk</option>
                    <option value="underperformed">Underperformed</option>
                </select>
            </div>
        </div>
        </div>
    )
}

export default StaffSearchFilterKPI