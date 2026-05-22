import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";import PageTitle from "../../../components/common/page_title"
import InputKPITitle from "../../../components/manager/common/input_KPI_title"
import CategorySelection from "../../../components/manager/common/category_selection"
import { useState } from "react";
import TargetKPISelection from "../../../components/manager/common/target_kpi"
import Deadline from "../../../components/manager/common/deadline"
import KPIAssignStaff from "../../../components/manager/common/kpi_assign_staff"
import Description from "../../../components/manager/common/description";
import { updateKPI, fetchAllUsers } from "../api/api";
import { useLocation } from "react-router-dom";

function UpdateKPI() {
  const location = useLocation();
  const state = location.state || {};

  const [title, setTitle] = useState(state.title || "");
  const [description, setDescription] = useState(state.description || "");
  const [category, setCategory] = useState(state.category || "");
  const [target, setTarget] = useState(state.target || "");
  const [unit, setUnit] = useState(state.unit || "");
  const [deadline, setDeadline] = useState(
    state.deadline ? new Date(state.deadline) : null
  );
  const [assignedStaff, setAssignedStaff] = useState(
    state.team ? [state.team] : []
  );
  const [searchStaff, setSearchStaff] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Live staff list
  const [staffList, setStaffList] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => {
    fetchAllUsers()
      .then((data) => setStaffList(data.users || []))
      .catch(() => setStaffList([]))
      .finally(() => setLoadingStaff(false));
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setUnit("");
    setTarget("");
    setDeadline(null);
    setSearchStaff("");
    setAssignedStaff([]);
    setErrorMessage("");
  };

  const handleConfirm = async () => {
    if (!title.trim()) return setErrorMessage("KPI title is required");
    if (!description.trim()) return setErrorMessage("KPI description is required");
    if (!category) return setErrorMessage("Please select a category");
    if (!target || Number(target) <= 0)
      return setErrorMessage("Please enter a valid target KPI");
    if (!unit) return setErrorMessage("Please select a unit");
    if (!deadline) return setErrorMessage("Please select a deadline");
    if (assignedStaff.length === 0)
      return setErrorMessage("Please assign at least one staff");

    setErrorMessage("");
    setSubmitting(true);

    try {
      const kpiId = state.id; // must be passed via NavLink state
      if (!kpiId) throw new Error("KPI ID is missing. Cannot update.");

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        target: Number(target),
        unit,
        deadline: deadline ? deadline.toISOString().split("T")[0] : null,
        assignedTo: assignedStaff[0]?.id || assignedStaff[0] || null,
      };

      await updateKPI(kpiId, payload);
      setShowModal(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to update KPI. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div
        className="d-flex justify-content-center"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <PageTitle title="Update KPI" subtitle="Update a key performance indicator" />

        {errorMessage && (
          <div
            style={{
              backgroundColor: "#ffe5e5",
              color: "#d93025",
              padding: "10px",
              borderRadius: "8px",
              margin: "10px 20px",
            }}
          >
            {errorMessage}
          </div>
        )}

        <div
          className="mx-3 mb-4 d-flex justify-content-center"
          style={{
            flexDirection: "column",
            alignItems: "start",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            padding: "24px",
            gap: "20px",
          }}
        >
          <div className="d-flex" style={{ flexDirection: "row", gap: "400px" }}>
            <InputKPITitle value={title} setValue={setTitle} />
            <CategorySelection value={category} setValue={setCategory} />
          </div>

          <Description value={description} setValue={setDescription} />

          <div className="d-flex" style={{ flexDirection: "row", gap: "260px" }}>
            <TargetKPISelection
              unit={unit}
              setUnit={setUnit}
              target={target}
              setTarget={setTarget}
            />
            <Deadline value={deadline} setValue={setDeadline} />
          </div>

          <KPIAssignStaff
            staffList={loadingStaff ? [] : staffList}
            unit={unit}
            assignedStaff={assignedStaff}
            setAssignedStaff={setAssignedStaff}
            searchStaff={searchStaff}
            setSearchStaff={setSearchStaff}
          />

          <div
            className="d-flex"
            style={{
              marginTop: "20px",
              justifyContent: "center",
              alignItems: "center",
              gap: "50px",
            }}
          >
            <button
              onClick={handleConfirm}
              disabled={submitting}
              style={{
                width: "200px",
                backgroundColor: submitting ? "#8fa3d6" : "#2b4cb3",
                color: "#fff",
                padding: "10px 20px",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Saving…" : "Confirm"}
            </button>
          </div>

          {showModal && (
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
              <div className="modal-dialog" style={{ justifyContent: "center", display: "flex" }}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">KPI Updated</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => { setShowModal(false); }}
                    />
                  </div>
                  <div className="modal-body">
                    <p><strong>Title:</strong> {title}</p>
                    <p><strong>Description:</strong> {description}</p>
                    <p><strong>Category:</strong> {category}</p>
                    <p><strong>Target:</strong> {target} {unit}</p>
                    <p>
                      <strong>Deadline:</strong>{" "}
                      {deadline ? deadline.toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div className="modal-footer">
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowModal(false)}
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UpdateKPI;