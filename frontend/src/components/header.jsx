export default function Header({ title }) {
  return (
    <div
      style={{
        padding: "16px 24px",
        width:"200%",
        borderBottom: "1px solid #e5e7eb",
        background: "#ffffff",
        textAlign:"start",
        marginBottom:"20px",
      }}
    >

      <h2
        style={{
          margin: 0,
          marginLeft:"120px",
          fontSize: "18px",
          fontWeight: "600",
          color: "#111827"
        }}
      >
        {title}
      </h2>
    </div>
  );
}