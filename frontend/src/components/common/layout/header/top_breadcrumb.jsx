import {useNavigate} from "react-router-dom"

function TopBreadcrumb({ items }) {
  const navigate = useNavigate();

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "16px",
      fontWeight:"bold",
      padding:"10px",
    }}>
      
      {/* Back button */}
      <span
        style={{ cursor: "pointer", color: "#6b7280" }}
        onClick={() => navigate(-1)}
      >
        ←
      </span>

      {/* Breadcrumb items */}
      {items.map((item, index) => (
        <span key={index} style={{ display: "flex", alignItems: "center" }}>
          
          <span
            style={{
              cursor: item.path ? "pointer" : "default",
              color: item.path ? "#3b82f6" : "#111827",
              fontWeight: item.path ? "normal" : "500"
            }}
            onClick={() => item.path && navigate(item.path)}
          >
            {item.label}
          </span>

          {index < items.length - 1 && (
            <span style={{ margin: "0 6px", color: "#9ca3af" }}>
              /
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

export default TopBreadcrumb