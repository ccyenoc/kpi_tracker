function PageTitle({ title, subtitle }) {
  return (
    <div
      className="d-flex"
      style={{
        flexDirection: "column",
        textAlign: "left",
        padding: "20px",
        marginRight:"20px",
      }}
    >
      <h2 style={{ fontWeight: "bold" }}>{title}</h2>

      <h3
        style={{
          fontSize: "13px",
          color: "#64748b",
        }}
      >
        {subtitle}
      </h3>
    </div>
  );
}
export default PageTitle