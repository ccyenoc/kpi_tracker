import { useLocation } from "react-router-dom";
import { useState } from "react"
import PageTitle from "../components/page_title";

function VerifyKPI() {
  const location = useLocation();
  const state = location.state || {};

  const progressContainerStyle = {
    width: "100%",
    padding: "4px",
    height: "20px",
    backgroundColor: "#85aeff",
    borderRadius: "999px",
    overflow: "hidden",
  };

  const progressBarStyle = (progress) => ({
    height: "100%",
    width: `${progress}%`,
    backgroundColor: "#2563eb",
    borderRadius: "999px",
    transition: "width 0.3s ease",

  });

  {/*file upload*/ }
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "the name of the file.jpg",
      url: "/sample.jpg", // put file in public folder
      approved: true
    }
  ]);
  const [approved, setApproved] = useState(false);

  const fieldStyle = {
    minHeight: "100px",
    lineHeight: "40px",
    height: "20px",
    width: "100%",
    padding: "0 12px",
    fontSize: "14px",
    borderRadius: "15px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
    backgroundColor: "white",
  };

  const buttonStyle = {
    width: "100%",
    backgroundColor: "#1e3a8a",
    color: "#fff",
    padding: "10px 20px",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    cursor: "pointer"
  }

  const fileCardStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e3a8a",
    color: "white",
    padding: "12px 16px",
    borderRadius: "10px",
    marginTop: "10px"
  };

  const h3TitleStyle = {
    marginTop: "20px",
    fontSize: "16px",
    textAlign: "start",
    fontWeight: "bold",
  }

  const h3ContentStyle = {
    borderRadius: "12px",
    padding: "15px",
    fontSize: "14px",
    border: "1px solid #ccc",
    textAlign: "start",
    width: "100%",
    height: "100%",
    maxHeight: "50px",
  }
  return (
    <div>
      <div className="d-flex flex-column justify-content-center">

        <PageTitle
          title="Verify KPI Submission"
          subtitle="Review and approve KPI completion eveidence" />

        <div
          className="mx-3 mb-4 d-flex justify-content-center"
          style={{
            flexDirection: "column",
            alignItems: "start",
            padding: "48px",
            gap: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}>



          {/*container for the submission detail*/}
          <div
            className="d-flex"
            style={{
              width: "100%",
              flexDirection: "column",
              textAlign: "start",
              backgroundColor: "#ffffff",
            }}>


            {/*title and category*/}
            <div
              className="d-flex flex-grow-1"
              style={{
                flexDirection: "row",
                gap: "50px",
                justifyContent: "space-between",
              }}>
              <div className="flex-grow-1" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <h3 style={{
                  ...h3TitleStyle,
                  marginTop: "0px",
                }}>KPI Title</h3>
                <h3 style={h3ContentStyle}>{state.title}</h3>
              </div>

              <div className="flex-grow-1" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <h3 style={{
                  ...h3TitleStyle,
                  marginTop: "0px",
                }}>Category</h3>
                <h3 style={h3ContentStyle}>{state.category}</h3>
              </div>
            </div>

            {/*desc*/}
            <h3 style={
              h3TitleStyle}>KPI Description</h3>
            <h3 style={h3ContentStyle}>{state.desc}</h3>

            {/*progress*/}
            <h3 style={h3TitleStyle}>Final Progress</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={progressContainerStyle}>
                <div style={progressBarStyle(Math.round((state.current / state.target_kpi) * 100))} />
              </div>
              <span className="d-flex flex-row" style={{ fontSize: "16px", width: "140px" }}>
                {state.current} / {state.target_kpi} ({Math.round((state.current / state.target_kpi) * 100)}%)
              </span>
            </div>

            {/*evidence*/}
            <h3 style={h3TitleStyle}>Evidence</h3>
            {files.map(file => (
              <div
                key={file.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexGrow: 1,
                  gap: "50px",
                  justifyContent: "space-between",
                  marginTop: "10px"
                }}
              >

                {/*file card*/}
                <div className="w-100" style={fileCardStyle}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    📄
                    <a
                      href={file.url}
                      target="_blank"
                      style={{ color: "white", fontSize: "14px" }}
                    >
                      {file.name}
                    </a>
                  </div>
                </div>

                {/*checkbox*/}
                <div className="w-100" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <input
                    type="checkbox"
                    checked={file.approved}
                    onChange={() => {
                      setFiles(files.map(f =>
                        f.id === file.id ? { ...f, approved: !f.approved } : f
                      ));
                    }}
                  />
                  <span style={{ fontSize: "14px" }}>Approved</span>
                </div>

              </div>


            ))}

            {/*submitted date and deadline*/}
            <div
              className="d-flex"
              style={{
                flexDirection: "row",
                gap: "50px",
                flexGrow: 1,
                justifyContent: "space-between",
              }}>
              <div className="w-100">
                <h3 style={h3TitleStyle}>Submitted Date</h3>
                <h3 style={h3ContentStyle}>{state.submitted_date}</h3>
              </div>

              <div className="w-100">
                <h3 style={h3TitleStyle}>Deadline</h3>
                <h3 style={h3ContentStyle}>{state.deadline}</h3>
              </div>
            </div>

            {/*note*/}
            <div className="mb-4">
              <h3 style={h3TitleStyle}>Note</h3>
              <textarea
                type="text"
                placeholder="Enter Note ... "
                style={fieldStyle} />
            </div>

            {/*buttons*/}
            <div
              className="d-flex"
              style={{
                marginTop: "20px",
                flexDirection: "row",
                gap: "50px",
              }}>
              <button style={buttonStyle}>Approve</button>
              <button style={buttonStyle}>Return</button>
            </div>
          </div>
        </div>
      </div>
    </div>








  )
}

export default VerifyKPI