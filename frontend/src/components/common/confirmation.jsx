export default function Confirmation({ title, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "380px",
          padding: "35px 30px",
          borderRadius: "20px",
          textAlign: "center",
          boxShadow: "0 15px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: "70px",
            height: "70px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: "#22c55e",
            color: "white",
            fontSize: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
          }}
        >
          ✓
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "28px",
            color: "#1f2937",
          }}
        >
          Success
        </h2>

        <p
          style={{
            marginTop: "12px",
            marginBottom: "28px",
            color: "#6b7280",
            fontSize: "16px",
            lineHeight: "1.5",
          }}
        >
          {title} successfully!
        </p>

        <button
          onClick={onClose}
          style={{
            background: "#2563eb",
            color: "white",
            border: "none",
            padding: "12px 40px",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}