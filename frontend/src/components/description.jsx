export default function Description({ value, setValue }){
    return(
        <div
          style={{
            display:"flex",
            flexDirection:"column",
            textAlign:"start",
            width:"100%",
          }}>

            <h3
              style={{
                fontSize:"16px",
                fontWeight: "bold",
              }}>
                Description
            </h3>

            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter KPI description"
                style={{
                 width: "100%",
                 fontSize: "14px",
                 padding: "10px",
                 borderRadius: "8px",
                 border: "1px solid #ccc"
                }}
                rows={4}
                />

        </div>
    )
}