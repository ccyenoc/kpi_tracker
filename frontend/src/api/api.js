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
  sendVerificationEmail: (email) => {
    const response = await fetch(`${API_BASE_URL}/api/verify-email`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data.detail || data.message || 'Failed to send verification code';
      throw new Error(errorMsg);
    }

    return data;
  },

  verifyEmailCode: (email, code) => {
    const response = await fetch(`${API_BASE_URL}/api/verify-code`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ email, code })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data.detail || data.message || 'Verification failed';
      throw new Error(errorMsg);
    }
    return data;
  },

  register: async (payload) => {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.success) {
      let errorMsg = `${data.detail || 'Please try again'}`;
      if (data.detail && data.detail.toLowerCase().includes("email")) {
        errorMsg = "Email already registered.";
      }
      throw new Error(errorMsg);
    }

    return data;
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      let errorMsg = "Invalid email or password";

      if (data.detail && data.detail.toLowerCase().includes("authentication")) {
        errorMsg = "Invalid email or password";
      } else if (data.detail && data.detail.toLowerCase().includes("invalid")) {
        errorMsg = "Invalid email or password";
      }

      throw new Error(errorMsg);
    }

    return data;
  },

  fetchCurrentUser: () => request("GET", "/api/user"),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const user = {
  fetchAll: () => request("GET", "/api/users"),

  fetchById: (userId) => request("GET", `/api/users/${userId}`),

  updateProfile: async (profileData) => request("PUT", "/api/profile", profileData),

  updatePassword: async (passwordData) => request("PUT", "/api/password", passwordData),

  deleteAccount: async () => request("DELETE", "/api/profile"),

  getAllStaff: () => request("GET", "/api/staff"),
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
  submitKPIProgress: async (form) => request("POST", "/api/kpi/update", form),
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

  getWeeklyReport: async () => requestBlob("GET", "/report/weekly"),

  getMonthlyReport: async () => requestBlob("GET", "/report/monthly"),

  getMyWeeklyReport: async () => requestBlob("GET", "/report/weekly/me"),

  getMyMonthlyReport: async () => requestBlob("GET", "/report/monthly/me"),
};
