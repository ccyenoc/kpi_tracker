import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageTitle from "../components/page_title";
import InputKPITitle from "../components/input_KPI_title";
import CategorySelection from "../components/category_selection";
import TargetKPISelection from "../components/target_kpi";
import Deadline from "../components/deadline";
import KPIAssignStaff from "../components/kpi_assign_staff";
import TopBreadcrumb from "../components/top_breadcrumb";
import { updateKPI, fetchStaff } from "../api/kpiApi";
import { pathway } from "../Pathway";
import { categories } from "../data/categoriesData";

function EditKPI() {
  const navigate = useNavigate();
  const location = useLocation();

  // KPI data passed via navigation state from the table row
  const kpi = location.state || {};

  // Form state – pre-filled from existing KPI
  const [title, setTitle] = useState(kpi.title || "");
  const [categoryId, setCategoryId] = useState(kpi.categoryId || "");
  const [target, setTarget] = useState(kpi.target ?? "");
  const [unit, setUnit] = useState(kpi.unit || "");
  const [deadline, setDeadline] = useState(kpi.deadline || "");
  const [status, setStatus] = useState(kpi.status || "pending");
  const [assignedStaff, setAssignedStaff] = useState([]);

  // Staff list from backend
  const [staffList, setStaffList] = useState([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStaff()
      .then((list) => {
        setStaffList(list);

        // Pre-fill selected staff from existing kpiAssignments
        if (kpi.kpiAssignments && kpi.kpiAssignments.length > 0) {
          const preSelected = kpi.kpiAssignments.map((assignment) => {
            const staffMember = list.find((s) => s.id === assignment.userId);
            return {
              id: assignment.userId,
              name: staffMember?.name || assignment.userId,
              email: staffMember?.email || "",
              role: "staff",
              kpi: assignment.target || 0,
            };
          });
          setAssignedStaff(preSelected);
        }
      })
      .catch(() => setStaffList([]));
  }, []);

  if (!kpi.id) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#ef4444" }}>
        No KPI data found. Please go back and select a KPI to edit.
        <br />
        <button
          onClick={() => navigate(pathway.KpiManagement)}
          style={{ marginTop: "16px", padding: "8px 20px", cursor: "pointer" }}
        >
          ← Back to KPI Management
        </button>
      </div>
    );
  }

  const handleUpdate = async () => {
    if (!title.trim()) {
      setError("KPI title is required.");
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);

    // Preserve existing progress (current) for staff already assigned;
    // only default to 0 for newly added staff.
    const existingAssignments = kpi.kpiAssignments || [];
    const kpiAssignments = assignedStaff.map((s) => {
      const existing = existingAssignments.find((a) => a.userId === s.id);
      return {
        userId: s.id,
        current: existing ? existing.current : 0,
        target: Number(s.kpi) || Number(target) || 0,
      };
    });

    const payload = {
      title: title.trim(),
      categoryId: categoryId || "",
      categoryName: selectedCategory?.name || "",
      target: Number(target) || null,
      unit: unit || "",
      deadline: deadline || null,
      status,
      assignedUserIds: assignedStaff.map((s) => s.id),
      kpiAssignments,
    };

    setSubmitting(true);
    setError(null);
    try {
      const updatedKpi = await updateKPI(kpi.id, payload);
      // Navigate back to the progress page with fresh KPI data
      navigate(pathway.KPIProgressPage, { state: updatedKpi });
    } catch (err) {
      setError(err.message);
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
          title="Edit KPI"
          subtitle={`Editing: ${kpi.title}`}
        />

        <div
          className="mx-3 mb-4 d-flex justify-content-center"
          style={{
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "start",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            padding: "24px",
            gap: "20px",
          }}
        >
          {/* Title + Category row */}
          <div
            className="d-flex"
            style={{ flexDirection: "row", gap: "40px", width: "100%" }}
          >
            <div style={{ flex: 1 }}>
              <InputKPITitle
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <CategorySelection
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              />
            </div>
          </div>

          {/* Target + Deadline row */}
          <div
            className="d-flex"
            style={{ flexDirection: "row", gap: "40px", width: "100%" }}
          >
            <div style={{ flex: 1 }}>
              <TargetKPISelection
                target={target}
                setTarget={setTarget}
                unit={unit}
                setUnit={setUnit}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Deadline date={deadline} setDate={setDeadline} />
            </div>
          </div>

          {/* Status selector */}
          <div style={{ textAlign: "start" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>Status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                background: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                color: "#333",
              }}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="at_risk">At Risk</option>
            </select>
          </div>

          {/* Assign staff */}
          <KPIAssignStaff
            staffList={staffList}
            unit={unit}
            initialSelected={assignedStaff}
            onAssignChange={setAssignedStaff}
          />

          {/* Error message */}
          {error && (
            <div
              style={{
                color: "#dc2626",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "10px 16px",
                width: "100%",
                fontSize: "14px",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Action buttons */}
          <div
            className="d-flex"
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "50px",
              width: "100%",
            }}
          >
            <button
              onClick={() => navigate(pathway.KPIProgressPage, { state: kpi })}
              style={{
                width: "200px",
                backgroundColor: "#e5e7eb",
                color: "#374151",
                padding: "10px 20px",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={submitting}
              style={{
                width: "200px",
                backgroundColor: submitting ? "#93c5fd" : "#2b4cb3",
                color: "#fff",
                padding: "10px 20px",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditKPI;
