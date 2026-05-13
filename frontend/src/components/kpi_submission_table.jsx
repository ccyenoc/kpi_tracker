import {useNavigate} from "react-router-dom"
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

  const statusStyle = (status) => {
    const colors = {
      Completed: "#bbf7d0",
      Pending: "#fde68a",
      Rejected: "#fecaca",
    };

    return {
      background: colors[status] || "#e5e7eb",
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
      <div style={headerStyle}>
        <div style={{ flex: 1.2, maxWidth: "100px", minWidth: 0 }}>Staff</div>
        <div style={{ flex: 2.5 }}>KPI Title</div>
        <div style={{ flex: 3 }}>Progress</div>
        <div style={{ flex: 1.5 }}>Category</div>
        <div style={{ flex: 1.2 }}>Submitted</div>
        <div style={{ flex: 1.5 }}>Evidence</div>
        <div style={{ flex: 1.2 }}>Status</div>
      </div>

      <div>
        {submissions.map(item => {
          const user = userMap[item.userId];
          const kpi = kpiMap[item.kpiId];

          // FIX 1: Skip rows where user or kpi lookup fails — prevents crash on
          // undefined access (e.g. kpi.categoryId throws if kpi is undefined)
          if (!user || !kpi) return null;

          // FIX 2: Use optional chaining on kpi.categoryId just in case
          const category = categoryMap[kpi?.categoryId];

          // FIX 3: Guard against missing target to avoid NaN in progress bar
          const progressPercent = kpi.target
            ? Math.min((item.current / item.target) * 100, 100)
            : 0;

          return (
            <div 
              style={rowStyle}
              key={item.id}
              onClick={() => navigate(pathway.VerifyKPI, { state: item })}>

              {/* Staff */}
              <div style={{ 
                flex: 1.2,
                maxWidth: "100px",
                minWidth: 0,
                whiteSpace: "normal",
                wordBreak: "break-word",
                overflowWrap: "break-word" 
              }}>
                <div style={{ fontWeight: "500" }}>{user.name}</div>
                <div style={{ fontSize: "13px", color: "#6b7280" }}>{user.email}</div>
              </div>

              {/* KPI Title */}
              <div style={{ flex: 2.5 }}>
                <div style={{ 
                  fontWeight: "500",
                  maxWidth: "200px",
                  minWidth: 0,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "break-word" 
                }}>{kpi.title}</div>
                <div style={{ 
                  fontSize: "13px",
                  color: "#6b7280",
                  maxWidth: "200px",
                  minWidth: 0,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "break-word"
                }}>{kpi.description}</div>
              </div>

              {/* Progress */}
              <div style={{ flex: 3, display: "flex", alignItems: "center" }}>
                <div style={{
                  width: "100%",
                  maxWidth: "220px",
                  background: "#e5e7eb",
                  borderRadius: "10px",
                  height: "8px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${progressPercent}%`,
                    background: "#3b82f6",
                    height: "100%"
                  }} />
                </div>
              </div>

              {/* Category */}
              <div style={{ flex: 1.5 }}>
                <div style={{ fontWeight: "500" }}>{category?.name}</div>
              </div>

              {/* Submitted date */}
              <div style={{ flex: 1.2 }}>
                <div style={{ fontWeight: "500" }}>{item.submittedAt}</div>
              </div>

              {/* Evidence */}
              <div style={{ flex: 1.5 }}>
                <div style={{ 
                  fontWeight: "500",
                  maxWidth: "100px",
                  minWidth: 0,
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  overflowWrap: "break-word"
                }}>{item.evidence}</div>
              </div>

              {/* Status */}
              <div style={{ flex: 1.2 }}>
                <span style={statusStyle(item.status)}>{item.status}</span>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

export default KPISubmissionTable;