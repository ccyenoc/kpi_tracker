import { useEffect, useState } from "react";
import { useLocation, NavLink, useNavigate } from "react-router-dom";
import PageTitle from "../../../components/common/page_title"
import { useLocation , NavLink} from "react-router-dom";
import ProgressInputKPITitle from "../../../components/manager/kpi_management/kpi_progress/progress_input_KPI_title";
import ProgressCategorySelection from "../../../components/manager/kpi_management/kpi_progress/progress_category_selection";
import ProgressKPIPrediction from "../../../components/manager/kpi_management/kpi_progress/progress_prediction";
import ProgressTargetKPISelection from "../../../components/manager/kpi_management/kpi_progress/progress_target_kpi";
import ProgressDeadline from "../../../components/manager/kpi_management/kpi_progress/progress_deadline";
import ProgressKPIAssignStaff from "../../../components/manager/kpi_management/kpi_progress/progress_kpi_assign_staff";
import ProgressKPIGraph from "../../../components/manager/kpi_management/kpi_progress/progress_kpi_graph";
import { pathway } from "../../../Pathway";

import { fetchKPIPrediction, deleteKPI, fetchCategories, fetchAllUsers } from "../api/api";

function KPIProgressPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const [prediction, setPrediction] = useState(null);
  const [category, setCategory] = useState(null);
  const [users, setUsers] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);

  // Graph data derived from staffPredictions or fallback
  const [graphData, setGraphData] = useState([
    { week: "Week 1", progress: 0, prediction: 0 },
  ]);

  useEffect(() => {
    // Fetch all users to get staff names
    fetchAllUsers()
      .then((data) => {
        setUsers(data.users || []);
      })
      .catch(() => {});

    // If categoryName is provided in state, use it directly
    if (state.categoryName) {
      setCategory({ name: state.categoryName });
    } else {
      // Otherwise try to load categories and match by ID
      fetchCategories()
        .then((data) => {
          const cats = data.categories || [];
          const match = cats.find(
            (c) => c.id === state.categoryId || c.id === state.category
          );
          setCategory(match || null);
        })
        .catch(() => {});
    }

    // Load prediction if we have a KPI id
    if (state.id) {
      fetchKPIPrediction(state.id)
        .then((data) => {
          setPrediction(data);

          // Build simple graph data from staff predictions
          const staffPreds = data.staffPredictions || [];
          if (staffPreds.length > 0) {
            const avg = (arr, key) =>
              Math.round(arr.reduce((s, p) => s + (p[key] || 0), 0) / arr.length);
            setGraphData([
              {
                week: "Current",
                progress: avg(staffPreds, "currentProgress"),
                prediction: avg(staffPreds, "predictedProgress"),
              },
            ]);
          }
        })
        .catch((err) => setError(err.message));
    }
  }, [state.id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteKPI(state.id);
      navigate(pathway.KPIManagement || "/manager/kpi");
    } catch (err) {
      setError(err.message || "Failed to delete KPI");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div
      className="d-flex"
      style={{ flexDirection: "column", marginBottom: "20px" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "row",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <PageTitle
          title="Track KPI Progress"
          subtitle="Track real time KPI progress and status prediction"
        />

        <div style={{ display: "flex", gap: "10px" }}>
          <NavLink
            to={pathway.UpdateKPI}
            style={{ textDecoration: "none" }}
            state={{
              id: state.id,
              title: state.title,
              description: state.description,
              category: state.categoryId,
              target: state.target,
              unit: state.unit,
              deadline: state.deadline,
              team: state.team,
            }}
          >
            <button
              style={{
                backgroundColor: "#2b4cb3",
                color: "#ffffff",
                fontSize: "16px",
                border: "none",
                borderRadius: "16px",
                padding: "10px",
              }}
            >
              Update KPI
            </button>
          </NavLink>

          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              backgroundColor: "#ff0000",
              color: "#ffffff",
              fontSize: "16px",
              border: "none",
              borderRadius: "16px",
              padding: "10px",
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: "#d93025", padding: "10px 20px" }}>{error}</div>
      )}

      {/* Prediction + Graph */}
      <div
        className="mx-3 mb-4 d-flex"
        style={{
          padding: "24px",
          flexDirection: "row",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <ProgressKPIPrediction
          overallPredictedProgress={prediction?.overallPredictedProgress}
          daysRemaining={prediction?.daysRemaining}
          staffPredictions={prediction?.staffPredictions}
        />
        <ProgressKPIGraph data={graphData} />
      </div>

      {/* KPI details */}
      <div
        className="mx-3 mb-4 d-flex"
        style={{
          padding: "24px",
          flexDirection: "column",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <div
          className="d-flex"
          style={{ flexDirection: "row", gap: "400px", marginTop: "20px" }}
        >
          <ProgressInputKPITitle title={state.title} />
          <ProgressCategorySelection category={category} />
        </div>

        <div
          className="d-flex"
          style={{ flexDirection: "row", marginTop: "20px", gap: "420px" }}
        >
          <ProgressTargetKPISelection kpi={state.target} unit={state.unit} />
          <ProgressDeadline date={state.deadline} />
        </div>

        <div
          className="d-flex"
          style={{ flexDirection: "row", marginTop: "40px" }}
        >
          <ProgressKPIAssignStaff
            staffProgress={
              // Build staff list from assignedUserIds with actual user data
              (state.assignedUserIds && state.assignedUserIds.length > 0)
                ? state.assignedUserIds.map((userId, idx) => {
                    const user = users.find(u => u.id === userId);
                    const staffPred = prediction?.staffPredictions?.[idx];
                    return {
                      staffId: userId,
                      name: user?.name || `User ${userId}`,
                      email: user?.email || "",
                      assignedKpi: state.target,
                      progress: staffPred ? Math.round((staffPred.currentProgress / 100) * state.target) : 0,
                      target: state.target,
                      evidenceCount: 0,
                    };
                  })
                // Fallback: try prediction data or use team
                : prediction?.staffPredictions?.map((p) => ({
                    staffId: p.staffId,
                    name: p.staffName,
                    email: "",
                    assignedKpi: state.target,
                    progress: Math.round((p.currentProgress / 100) * state.target),
                    target: state.target,
                    evidenceCount: 0,
                  })) || [
                    {
                      staffId: 1,
                      name: state.team || "—",
                      email: "",
                      assignedKpi: state.target,
                      progress: 0,
                      target: state.target,
                      evidenceCount: 0,
                    },
                  ]
            }
            unit={state.unit || "units"}
          />
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "12px",
              width: "350px",
              textAlign: "center",
              boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: "40px", color: "#ef4444" }}>⚠️</div>
            <h4 style={{ marginTop: "10px" }}>Delete KPI?</h4>
            <p style={{ color: "#555", fontSize: "14px" }}>
              This action is permanent and cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "15px" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 20px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KPIProgressPage;