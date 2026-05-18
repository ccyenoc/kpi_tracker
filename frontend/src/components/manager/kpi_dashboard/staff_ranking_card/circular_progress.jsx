function CircularProgress({ value }) {
  const degree = (value / 100) * 360;

  return (
    <div
      style={{
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: `conic-gradient(
          #16a34a 0deg ${degree}deg,
          #e5e7eb ${degree}deg 360deg
        )`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* inner circle */}
      <div
        style={{
          width: "45px",
height: "45px",
fontSize: "12px",
          borderRadius: "50%",
          background: "#f1f1f1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "600",
        }}
      >
        {value}%
      </div>
    </div>
  );
}

export default CircularProgress;