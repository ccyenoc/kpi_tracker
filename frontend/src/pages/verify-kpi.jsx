import { useLocation } from "react-router-dom";
import { useState } from "react"
import ManagerSidebar from "../components/Sidebar";
import PageTitle from "../components/page_title";
import TopBreadcrumb from "../components/top_breadcrumb";

function VerifyKPI() {
  const location = useLocation();
  const state = location.state || {};

  const progressContainerStyle = {
    width: "100%",
    maxWidth: "500px",
    height: "10px",
    backgroundColor: "#e5e7eb",
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
    width: "900px",
    padding: "0 12px",
    fontSize: "14px",
    borderRadius: "15px",
    border: "1px solid #ccc",
    boxSizing: "border-box",
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
  }
  return (
    <div>
      <TopBreadcrumb
        items={[
          { label: "Verify KPI Dashboard", path: "/verify-kpi-dashboard" },
          { label: "Verify KPI" }
        ]}
      />
      <div className="d-flex flex-column justify-content-center">

        <PageTitle
          title="Verify KPI Submission"
          subtitle="Review and approve KPI completion eveidence" />

        <div
          className="d-flex justify-content-center"
          style={{
            width: "109%",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "start",
            padding: "20px",
            gap: "20px"
            ,
          }}>



          {/*container for the submission detail*/}
          <div
            className="d-flex"
            style={{
              flexDirection: "column",
              textAlign: "start",
              padding: "20px",
              borderRadius: "12px",
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",

            }}>


            {/*title and category*/}
            <div
              className="d-flex"
              style={{
                flexDirection: "row",
                gap: "400px",
              }}>
              <div>
                <h3 style={{
                  ...h3TitleStyle,
                  marginTop: "0px",
                }}>KPI Title</h3>
                <h3 style={h3ContentStyle}>{state.title}</h3>
              </div>

              <div>
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
                <div style={progressBarStyle(state.progress)} />
              </div>
              <span style={{ fontSize: "16px" }}>
                {state.progress}%
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
                  justifyContent: "space-between",
                  marginTop: "10px"
                }}
              >

                {/*file card*/}
                <div style={fileCardStyle}>
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
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                gap: "400px",
              }}>
              <div>
                <h3 style={h3TitleStyle}>Submitted Date</h3>
                <h3 style={h3ContentStyle}>{state.submitted_date}</h3>
              </div>

              <div>
                <h3 style={h3TitleStyle}>Deadline</h3>
                <h3 style={h3ContentStyle}>{state.deadline}</h3>
              </div>
            </div>

            {/*note*/}
            <h3 style={h3TitleStyle}>Note</h3>
            <textarea
              type="text"
              placeholder="Enter Note ... "
              style={fieldStyle} />


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