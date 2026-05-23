import CircularProgress from "./circular_progress";

function TopStaffCard({
  name,
  kpi,
  timeliness,
  quality,
  performance,
  rank,
}) {
  const rankColor = {
    1: "#FFD700",
    2: "#D1D5DB",
    3: "#CD7F32",
  };

  const medal = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
  };

  function ProgressRow(label, value, color) {
    return (
      <div style={{ marginBottom: "14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "13px",
            marginBottom: "6px",
          }}
        >
          <span>{label}</span>
          <span>{value}%</span>
        </div>

        <div
          style={{
            height: "8px",
            background: "#e5e7eb",
            borderRadius: "999px",
          }}
        >
          <div
            style={{
              width: `${value}%`,
              background: color,
              height: "100%",
              borderRadius: "999px",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        border:
          rank === 1
            ? `2px solid ${rankColor[rank]}`
            : "1px solid #eee",

        borderRadius: "20px",
        padding: "20px",
        marginTop: "16px",
        marginBottom: "18px",

        boxShadow: "0 10px 24px rgba(0,0,0,.08)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* LEFT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Medal */}
          <div
            style={{
              fontSize: "26px",
            }}
          >
            {medal[rank]}
          </div>

          {/* Initial Avatar */}
          <div
            style={{
              width: "56px",
              height: "56px",

              borderRadius: "50%",

              background:
                rank === 1
                  ? "#FFD700"
                  : rank === 2
                  ? "#D1D5DB"
                  : "#CD7F32",

              color: "#fff",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              fontSize: "24px",
              fontWeight: "700",

              textTransform: "uppercase",

              flexShrink: 0,
            }}
          >
            {name
              ?.split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </div>

          {/* Name */}
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "18px",
              }}
            >
              {name}
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#777",
              }}
            >
              Top Performer #{rank}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div
          style={{
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "26px",
              fontWeight: "700",
              color: "#2563eb",
            }}
          >
            {performance}%
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#777",
            }}
          >
            Overall
          </div>
        </div>
      </div>

      {/* PROGRESS */}
      <div
        style={{
          marginTop: "20px",
        }}
      >
        {ProgressRow(
          "KPI Completion",
          kpi,
          "#2563eb"
        )}

        {ProgressRow(
          "Timeliness",
          timeliness,
          "#10b981"
        )}

        {ProgressRow(
          "Quality",
          quality,
          "#f59e0b"
        )}
      </div>
    </div>
  );
}

export default TopStaffCard;