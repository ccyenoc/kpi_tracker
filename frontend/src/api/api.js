const BASE = "";

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const sendVerificationEmail = (email) =>
  request("POST", "/api/verify-email", { email });

export const verifyEmailCode = (email, code) =>
  request("POST", "/api/verify-code", { email, code });

export const registerUser = (payload) =>
  request("POST", "/api/register", payload);

export const loginUser = (email, password) =>
  request("POST", "/api/login", { email, password });

export const fetchCurrentUser = () => request("GET", "/api/user");

// ── Users ─────────────────────────────────────────────────────────────────────
export const fetchAllUsers = () => request("GET", "/api/users");

export const fetchUserById = (userId) => request("GET", `/api/users/${userId}`);

// ── Categories ────────────────────────────────────────────────────────────────
export const fetchCategories = () => request("GET", "/api/categories");

// ── KPIs (manager) ───────────────────────────────────────────────────────────
export const fetchManagerKPIs = () => request("GET", "/api/manager/kpis");

export const fetchKPIById = (kpiId) => request("GET", `/api/kpi/${kpiId}`);

export const createKPI = (payload) => request("POST", "/api/manager/kpi", payload);

export const updateKPI = (kpiId, payload) =>
  request("PUT", `/api/manager/kpi/${kpiId}`, payload);

export const deleteKPI = (kpiId) =>
  request("DELETE", `/api/manager/kpi/${kpiId}`);

// ── KPI Prediction ────────────────────────────────────────────────────────────
export const fetchKPIPrediction = (kpiId) =>
  request("GET", `/api/kpi/${kpiId}/prediction`);

// ── Submissions ───────────────────────────────────────────────────────────────
export const fetchSubmissions = () => request("GET", "/api/kpi/submissions");

export const approveSubmission = (submissionId, note = "") =>
  request("POST", `/api/kpi/submissions/${submissionId}/approve`, { note });

export const returnSubmission = (submissionId, note = "") =>
  request("POST", `/api/kpi/submissions/${submissionId}/return`, { note });

// ── Staff KPI progress update (multipart) ─────────────────────────────────────
export async function submitKPIProgress({ kpiId, current, notes, files }) {
  const token = localStorage.getItem("token");
  const form = new FormData();
  form.append("kpiId", kpiId);
  form.append("current", current);
  form.append("notes", notes || "");
  (files || []).forEach((f) => form.append("files", f));

  const res = await fetch(`${BASE}/api/kpi/update`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || data.message || `HTTP ${res.status}`);
  return data;
}

// ── Manager dashboard aggregated stats ────────────────────────────────────────
export const fetchManagerDashboardStats = () =>
  request("GET", "/api/manager/dashboard/stats");

// ── Staff ranking (computed from dashboard stats) ─────────────────────────────
export const fetchStaffRankings = () =>
  fetchManagerDashboardStats().then((d) => ({
    success: true,
    rankings: d.staffRankings || [],
  }));

// ── KPI Status (at-risk and underperformed) ───────────────────────────────────
export const fetchAtRiskKPIs = () => request("GET", "/api/kpi/at-risk");

export const fetchUnderperformKPIs = () => request("GET", "/api/kpi/underperform");