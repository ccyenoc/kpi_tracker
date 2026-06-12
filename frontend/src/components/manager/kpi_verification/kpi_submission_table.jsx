import { useNavigate } from "react-router-dom"
import KPIProgressPage from "../../../pages/manager/kpi_management/kpi-progress";
import { useState } from "react";
import { pathway } from "../../../Pathway";
import { kpi } from "../../../api/api";
import Confirmation from "../../common/confirmation";

function KPISubmissionTable({submissions, users = [], kpis = [], categories = [], onSubmissionUpdated = null}) {
  const navigate = useNavigate();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [error, setError] = useState("");

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
      approved: "#bbf7d0",
      pending: "#fde68a",
      rejected: "#fecaca",
    };

    return {
      background: colors[status] || "#e5e7eb",
      padding: "4px 10px",
      borderRadius: "10px",
      fontSize: "12px",
    };
  };

  const handleApprove = async (submission) => {
    setSelectedSubmission(submission);
    setComments("");
    setError("");
    setShowModal(true);
  };

  const handleReject = async (submission) => {
    setSelectedSubmission(submission);
    setComments("");
    setError("");
    setShowModal(true);
  };

  const submitVerification = async (status) => {
    if (!selectedSubmission) return;
    
    setIsProcessing(true);
    setError("");
    try {
      const data = await kpi.verifySubmission({
        submissionId: selectedSubmission.id,
        kpiId: selectedSubmission.kpiId,
        status,
        comments,
      });

      if (data.success) {
        setConfirmationTitle(`Submission ${status}`);
        setShowConfirmation(true);

        setShowModal(false);
        setSelectedSubmission(null);
        setComments("");
      } else {
        setError(`Error: ${data.message}`);
      }

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
        "Failed to verify submission"
      );

    } finally {
      setIsProcessing(false);
    }
  };


 const userMap = Object.fromEntries(
  users.map((u) => [u.id || u.userId, u])
);

const kpiMap = Object.fromEntries(
  kpis.map((k) => [k.id, k])
);

const categoryMap = Object.fromEntries(
  categories.map((c) => [c.id, c])
);

console.log("KPIS", kpis);
console.log("FIRST KPI", kpis[0]);

  return (
    <div className="mx-3"
    style={{ 
        marginTop: "10px",
        padding:"20px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        borderRadius:"12px" }}>
      
      <div style={headerStyle}>
        <div style={{ flex: 1.2, maxWidth: "100px", minWidth: 0 }}>Staff</div>
        <div style={{ flex: 2.5 }}>KPI Title</div>
        <div style={{ flex: 3 }}>Progress</div>
        <div style={{ flex: 1.5 }}>Category</div>
        <div style={{ flex: 1.2 }}>Submitted</div>
        <div style={{ flex: 1.5 }}>Evidence</div>
        <div style={{ flex: 1.2 }}>Status</div>
        <div style={{ flex: 1.5 }}>Actions</div>
      </div>

      <div>
        {submissions && submissions.length > 0 ? submissions.map((item, idx) => {
          // Backend sends "submittedBy" not "userId"
          const userId = item.userId || item.submittedBy;
          const user = userMap[userId] || { name: `User ${userId}`, email: "" };
          const kpi = kpiMap[item.kpiId] || { title: `KPI ${item.kpiId}`, description: "", categoryId: "", target: 0 };
          const categoryColorMap = {
            sales: "#639fff",
            lead: "#7ef203",
            property: "#fff200",
            marketing: "#df93ff",
            customer: "#ff67e386",
          };

          const category = {
            name: kpi?.categoryName || "Unknown",
            color:
              categoryColorMap[
                kpi?.categoryId?.toLowerCase()
              ] || "#e5e7eb",
          };

          // Always show the row - use available data with fallbacks
          // item.current is from submission, kpi.target is from KPI data
          const target = item.target || kpi.target || 100;
          const current = item.current || 0;
          const progressPercent = target
            ? Math.min((current / target) * 100, 100)
            : 0;

          return (
            <div 
              style={rowStyle}
              key={`${item.id}-${idx}`}
              onClick={() => navigate(pathway.VerifyKPI, { state: item })}>

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

              <div style={{ flex: 1.5 }}>
              <span
                style={{
                  backgroundColor: category.color,
                  padding: "6px 12px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: "500",
                  display: "inline-block",
                  whiteSpace: "nowrap", 
                }}
              >
                {category.name}
              </span>
            </div>

              <div style={{ flex: 1.2 }}>
                <div style={{ fontWeight: "500" }}>{item.submittedAt}</div>
              </div>

              <div style={{ flex: 1.5 }}>
                {item.files && item.files.length > 0 ? (
                  <div>
                    {item.files.map((file, idx) => (
                      <div key={idx}>
                        <a 
                          href={`/api/kpi/evidence/${file.storedName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#3b82f6",
                            textDecoration: "underline",
                            cursor: "pointer",
                            fontSize: "13px",
                            display: "block",
                            maxWidth: "100px",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                            overflowWrap: "break-word"
                          }}
                          title={`View ${file.originalName}`}
                        >
                          📎 {file.originalName}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: "#999", fontSize: "13px" }}>No files</div>
                )}
              </div>

              <div style={{ flex: 1.2 }}>
                <span style={statusStyle(item.status)}>
                    {item.status?.charAt(0).toUpperCase() + item.status?.slice(1).toLowerCase()}
                </span>
              </div>

              <div style={{ flex: 1.5, display: "flex", gap: "5px" }}>
                {item.status === "pending" || item.status === "Pending" ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(item);
                      }}
                      style={{
                        padding: "5px 10px",
                        background: "#22c55e",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(item);
                      }}
                      style={{
                        padding: "5px 10px",
                        background: "#ef4444",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      ✕ Reject
                    </button>
                  </>
                ) : (
                  <span style={{ color: "#999", fontSize: "12px" }}>
                    {item.status === "approved" ? "✓ Approved" : "✕ Rejected"}
                  </span>
                )}
              </div>

            </div>
          );
        })
        : (
          <div style={{ padding: "20px", textAlign: "center", color: "#888" }}>
            No submissions available
          </div>
        )}
      </div>

      {showModal && selectedSubmission && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "30px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          }}>
            <h2 style={{ marginTop: 0, marginBottom: "20px" }}>Verify Submission</h2>
            
            {error && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                borderRadius: "8px",
                padding: "10px 14px",
                color: "#b91c1c",
                fontSize: "14px",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <span style={{ fontSize: "16px" }}>⚠️</span>
                <div style={{ flex: 1 }}>{error}</div>
                <span 
                  style={{ cursor: "pointer", fontWeight: "bold", opacity: 0.7 }} 
                  onClick={() => setError("")}
                >
                  ✕
                </span>
              </div>
            )}
            
            <div style={{ marginBottom: "20px", backgroundColor: "#f3f4f6", padding: "15px", borderRadius: "8px" }}>
              <p style={{ margin: "5px 0" }}><strong>KPI:</strong> {kpiMap[selectedSubmission.kpiId]?.title || "Unknown"}</p>
              <p style={{ margin: "5px 0" }}><strong>Staff:</strong> {userMap[selectedSubmission.userId || selectedSubmission.submittedBy]?.name || "Unknown"}</p>
              <p style={{ margin: "5px 0" }}><strong>Current Value:</strong> {selectedSubmission.current}</p>
              <p style={{ margin: "5px 0" }}><strong>Notes:</strong> {selectedSubmission.notes || "None"}</p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500" }}>
                Comments (optional):
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments about this submission..."
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  minHeight: "80px",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSubmission(null);
                }}
                disabled={isProcessing}
                style={{
                  padding: "10px 20px",
                  background: "#e5e7eb",
                  color: "#374151",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => submitVerification("rejected")}
                disabled={isProcessing}
                style={{
                  padding: "10px 20px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                {isProcessing ? "Processing..." : "✕ Reject"}
              </button>
              <button
                onClick={() => submitVerification("approved")}
                disabled={isProcessing}
                style={{
                  padding: "10px 20px",
                  background: "#22c55e",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                  opacity: isProcessing ? 0.5 : 1,
                }}
              >
                {isProcessing ? "Processing..." : "✓ Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmation && (
        <Confirmation
          title={confirmationTitle}
          onClose={() => {
            setShowConfirmation(false);

            if (onSubmissionUpdated) {
              onSubmissionUpdated();
            }
          }}
        />
      )}

    </div>
  );
}

export default KPISubmissionTable;