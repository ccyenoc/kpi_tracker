import {useNavigate} from "react-router-dom"
import KPIProgressPage from "../pages/kpi-progress";
import { pathway } from "../Pathway";
{/*import data*/}
import { users } from "../data/userData";
import { kpis } from "../data/kpiData";
import { categories } from "../data/categoriesData";

function KPISubmissionTable({submissions}) {
  const navigate = useNavigate();

  const headerStyle = {
    display: "flex",
    textAlign:"left",
    fontWeight: "bold",
    fontSize:"16px",
    padding:"5px",
    borderBottom: "1px solid #e5e7eb",
  };

  const rowStyle = {
    display: "flex",
    textAlign:"left",
    padding: "15px 0",
    fontSize:"14px",
    borderBottom: "1px solid #e5e7eb",
    alignItems: "center",
  };

  const badgeStyle = {
    background: "#e5e7eb",
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "12px",
  };

  const statusStyle = (status) => {
  const colors = {
    Approved: "#bbf7d0",       // green
    Pending: "#fde68a",       // yellow
    Rejected: "#fecaca",  // red
  };

  return {
    background: colors[status] || "#e5e7eb", // fallback (gray)
    padding: "4px 10px",
    borderRadius: "10px",
    fontSize: "12px",
  };
};

const userMap = Object.fromEntries(
  users.map(u => [u.id, u])
);

const kpiMap = Object.fromEntries(
  kpis.map(k => [k.id, k])
);

const categoryMap = Object.fromEntries(
  categories.map(c => [c.id, c])
);

  return (
    <div className="mx-3"
    style={{ 
        marginTop: "10px",
        padding:"20px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius:"12px" }}>
      
      {/* Header */}
      <div 
        style={headerStyle}>
        <div 
          style={{ 
            flex: 1.2,
            maxWidth: "100px",
            minWidth: 0 ,
            }}>Staff</div>
        <div 
          style={{ 
            flex: 2.5
        }}>KPI Title</div>
        <div 
          style={{ 
            flex: 3
            }}>Progress</div>
        <div
         style={{ 
            flex: 1.5
            }}>Category</div>
        <div 
        style={{ 
            flex: 1.2
            }}>Submitted</div>
        <div 
        style={{ 
            flex: 1.5
            }}>Evidence</div>
        <div 
        style={{ 
            flex: 1.2
            }}>Status</div>
      </div>


      <div>

        {submissions.map(item => {
          const user = userMap[item.submittedBy];
          const kpi = kpiMap[item.kpiId];
          const category = categoryMap[kpi.categoryId];

          return (
            <div 
            style={rowStyle}
            key={item.id}
            onClick={() => navigate(pathway.VerifyKPI, { state: item })}>

            {/* staff */}
            <div style={{ 
            flex: 1.2,
            maxWidth: "100px",
            minWidth: 0 ,
            whiteSpace: "normal",        //  allow wrapping
            wordBreak: "break-word",     //  break long text
            overflowWrap: "break-word" 
            }}>
            <div 
            style={{ 
              fontWeight: "500" 
              }}>{user.name}</div>
            <div 
            style={{ 
              fontSize: "13px", 
              color: "#6b7280" }}>
              {user.email}
            </div>
            </div>

            {/* title */}
            <div style={{ 
            flex: 2.5
            }}>
            <div 
            style={{ 
              fontWeight: "500" ,
              maxWidth: "200px",
              minWidth: 0 ,
              whiteSpace: "normal",        //  allow wrapping
              wordBreak: "break-word",     //  break long text
              overflowWrap: "break-word" 
              }}>{kpi.title}</div>
            <div 
            style={{ 
              fontSize: "13px", 
              color: "#6b7280",
              maxWidth: "200px",
              minWidth: 0 ,
              whiteSpace: "normal",        //  allow wrapping
              wordBreak: "break-word",     //  break long text
              overflowWrap: "break-word"  }}>
              {kpi.description}
            </div>
          </div>

          {/* progress */}
           <div style={{
  flex: 3,
  display: "flex",
  alignItems: "center"
}}>
  <div style={{
    width: "100%",       
    maxWidth: "220px",      
    background: "#e5e7eb",
    borderRadius: "10px",
    height: "8px",
    overflow: "hidden"
  }}>
    <div style={{
      width: `${(item.current / item.target) * 100}%`,
      background: "#3b82f6",
      height: "100%"
    }} />
  </div>
</div>
            {/* category */}
            <div
            style={{ 
            flex: 1.5,
            }}>
            <div 
            style={{ 
              fontWeight: "500" 
              }}>{category?.name}</div>
          </div>

          {/* submitted date */}
            <div style={{ 
            flex: 1.2
            }}>
            <div 
            style={{ 
              fontWeight: "500" 
              }}>{item.submittedAt}</div>
          </div>

          {/* evidence */}
            <div style={{ 
            flex: 1.5
            }}>
            <div 
            style={{ 
              fontWeight: "500" ,
              maxWidth: "100px",
              minWidth: 0 ,
              whiteSpace: "normal",        //  allow wrapping
              wordBreak: "break-word",     //  break long text
              overflowWrap: "break-word" 
              }}>{item.evidence}</div>
          </div>

          {/* status */}
            <div style={{ 
            flex: 1.2 ,
            }}>
             <span style={statusStyle(item.status)}>
               {item.status}
             </span>
          </div>
        


            </div>
        )})}
      </div>
      </div>
      

  )
}

export default KPISubmissionTable;