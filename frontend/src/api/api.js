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
  if (!res.ok) throw new Error(`Failed to fetch ${path}. ${res.status} - ${res.statusText} - ${data.detail || data.message || `HTTP ${res.status}`}`);
  return data;
}

async function requestBlob(method, path) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
  });
  const blob = await res.blob();
  if (!res.ok) {
    const text = await blob.text();
    throw new Error(`Failed to fetch ${path}. ${res.status} - ${res.statusText} - ${text}`);
  }
  return blob;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  sendVerificationEmail: (email) => request("POST", "/api/verify-email", { email }),

  verifyEmailCode: (email, code) => request("POST", "/api/verify-code", { email, code }),

  register: (payload) => request("POST", "/api/register", payload),

  login: (email, password) => request("POST", "/api/login", { email, password }),

  fetchCurrentUser: () => request("GET", "/api/user"),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const user = {
  fetchAll: () => request("GET", "/api/users"),

  fetchById: (userId) => request("GET", `/api/users/${userId}`),
}

// ── KPIs ─────────────────────────────────────────────────────────────────────
export const kpi = {
  // ── Manager ──────────────────────────────────────────────────────────────────
  fetchManagerKPIs: () => request("GET", "/api/manager/kpis"),

  fetchKPIById: (kpiId) => request("GET", `/api/kpi/${kpiId}`),

  createKPI: (payload) => request("POST", "/api/manager/kpi", payload),

  updateKPI: (kpiId, payload) =>
    request("PUT", `/api/manager/kpi/${kpiId}`, payload),

  deleteKPI: (kpiId) =>
    request("DELETE", `/api/manager/kpi/${kpiId}`),

  verifySubmission: (body) =>
    request("POST", "/api/kpi/verify-submission", body),

  fetchDashboardStats: () => request("GET", "/api/manager/dashboard/stats"),

  // ── Staff ──────────────────────────────────────────────────────────────────
  fetchStaffKPIs: () => request("GET", "/api/staff/kpi"),

  fetchStaffKPISubmissions: (kpiId) => request("GET", `/api/staff/kpi/submissions`),

  // ── KPI Prediction ────────────────────────────────────────────────────────────
  fetchKPIPrediction: (kpiId) =>
    request("GET", `/api/kpi/${kpiId}/prediction`),

  // ── KPI Status (at-risk and underperformed) ───────────────────────────────────
  fetchAtRiskKPIs: () => request("GET", "/api/kpi/at-risk"),

  fetchUnderperformKPIs: () => request("GET", "/api/kpi/underperform"),

  // ── Submissions ───────────────────────────────────────────────────────────────
  fetchSubmissions: () => request("GET", "/api/kpi/submissions"),

  approveSubmission: (submissionId, note = "") =>
    request("POST", `/api/kpi/submissions/${submissionId}/approve`, { note }),

  returnSubmission: (submissionId, note = "") =>
    request("POST", `/api/kpi/submissions/${submissionId}/return`, { note }),

  // ── Staff KPI progress update (multipart) ─────────────────────────────────────
  submitKPIProgress: async (form) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE}/api/kpi/update`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.message || `HTTP ${res.status}`);
    return data;
  }
};

export const util = {
  // ── Categories ────────────────────────────────────────────────────────────────
  fetchCategories: () => request("GET", "/api/categories"),

  // ── Manager dashboard aggregated stats ────────────────────────────────────────
  fetchManagerDashboardStats: () => request("GET", "/api/manager/dashboard/stats"),

  // ── Staff ranking (computed from dashboard stats) ─────────────────────────────
  fetchStaffRankings: () => util.fetchManagerDashboardStats().then((d) => ({
    success: true,
    rankings: d.staffRankings || [],
  })),

  getMyMonthlyReport: async () => requestBlob("GET", "/report/monthly/me"),
};
