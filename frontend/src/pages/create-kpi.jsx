// pages/create-kpi.jsx
import { useEffect, useState } from "react";
import PageTitle from "../components/page_title";
import InputKPITitle from "../components/input_KPI_title";
import CategorySelection from "../components/category_selection";
import TargetKPISelection from "../components/target_kpi";
import Deadline from "../components/deadline";
import KPIAssignStaff from "../components/kpi_assign_staff";
import Description from "../components/description";
import { createKPI, fetchAllUsers, fetchCategories } from "../api/api";

function CreateKPI() {
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState(null);
  const [searchStaff, setSearchStaff] = useState("");
  const [assignedStaff, setAssignedStaff] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Live data from backend
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
      // The backend KPICreate model accepts: title, description, category,
      // target, unit, deadline (ISO string), assignedTo (single user id).
      // For multi-staff assignment, we create one KPI per staff or use the
      // first assigned staff as primary (extend as needed).
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        target: Number(target),
        unit,
        deadline: deadline ? deadline.toISOString().split("T")[0] : null,
        assignedTo: assignedStaff[0]?.id || assignedStaff[0] || null,
      };

      await createKPI(payload);
      setShowModal(true);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create KPI. Please try again.");
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
        <PageTitle
          title="Create KPI"
          subtitle="Create a key performance indicator and assign to a staff"
        />

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
          {/* Title and category */}
          <div className="d-flex" style={{ flexDirection: "row", gap: "400px" }}>
            <InputKPITitle value={title} setValue={setTitle} />
            <CategorySelection value={category} setValue={setCategory} />
          </div>

          <Description value={description} setValue={setDescription} />

          {/* Target and deadline */}
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
              {submitting ? "Creating…" : "Confirm"}
            </button>
          </div>

          {/* Success modal */}
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
                    <h5 className="modal-title">KPI Created</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => { setShowModal(false); resetForm(); }}
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
                      onClick={() => { setShowModal(false); resetForm(); }}
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

export default CreateKPI;