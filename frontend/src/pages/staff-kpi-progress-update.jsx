import React, { useEffect, useState } from 'react';
import DashboardCards from "../components/4x1_cards_layout";
import StaffOverallProgress from "../components/staff_overall_progress";
import StaffSearchFilterKPI from "../components/staff_search_filter_kpi"
import StaffKPI from "../components/staff_kpi";
import UpdateKpiModal from "../components/staff_update_kpi"
import { useParams } from "react-router-dom";

const StaffKPIUpdate = () => {
  const { kpiId } = useParams();
  
  // In development, use Vite proxy; in production, use absolute URL
  const API_BASE_URL = import.meta.env.MODE === 'development' ? '' : 'http://127.0.0.1:8006';

  const groupSubmissionsByKpi = (submissionList = []) => {
    const groupedHistory = {};

    submissionList.forEach((submission) => {
      if (!groupedHistory[submission.kpiId]) {
        groupedHistory[submission.kpiId] = [];
      }

      groupedHistory[submission.kpiId].push(submission);
    });

    return groupedHistory;
  };

  const normalizeSubmissions = (submissionList = []) => {
    return submissionList.map((submission) => {
      const fileNames =
        submission.fileNames ||
        submission.files?.map((file) => file.originalName || file.name || file.storedName) ||
        [];

      return {
        ...submission,
        fileNames,
        files: submission.files || [],
      };
    });
  };



  const [kpis, setKpis] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const [selectedKpi, setSelectedKpi] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState({});

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const currentUserId = String(currentUser?.id || currentUser?.user_id || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchKPI, setSearchKPI] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const normalizeText = (value) =>
    String(value || "").trim().toLowerCase();

  const normalizeStatus = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.id, c])
  );

  // group submissions by KPI instead of keeping only one
  const submissionMap = submissions.reduce((map, submission) => {
    const key = submission.kpiId;
    if (!key) return map;

    if (!map[key]) {
      map[key] = [];
    }

    map[key].push(submission);
    return map;
  }, {});

  const CATEGORY_NAME_MAP = {
    sales: "Sales Performance",
    lead: "Lead Generation",
    property: "Property Management",
    marketing: "Marketing Performance",
    customer: "Customer Experience",
  };

  const getCategoryName = (kpi) => {
    return (
      kpi.categoryName ||
      kpi.category ||
      CATEGORY_NAME_MAP[kpi.categoryId] ||
      CATEGORY_NAME_MAP[kpi.category] ||
      CATEGORY_NAME_MAP[kpi.type] ||
      "General"
    );
  };

  const userKpis = kpis
  .filter((kpi) => {
    const assignedUserIds = (kpi.assignedUserIds || []).map(String);
    const assignedUsers = (kpi.assignedUsers || []).map(String);
    const kpiAssignments = kpi.kpiAssignments || [];

    return (
      assignedUserIds.includes(currentUserId) ||
      assignedUsers.includes(currentUserId) ||
      String(kpi.assignedTo || "") === currentUserId ||
      String(kpi.staffId || "") === currentUserId ||
      String(kpi.assignedStaffId || "") === currentUserId ||
      kpiAssignments.some((u) => String(u.userId || "") === currentUserId)
    );
  })
  .map((kpi) => {
    const userData = (kpi.kpiAssignments || []).find(
      (u) => String(u.userId || "") === currentUserId
    );

    const category = categoryMap[kpi.categoryId];
    const categoryName = getCategoryName(kpi);

    const history = submissionHistory[kpi.id] || submissionMap[kpi.id] || [];

    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
    );

    const latestUpdate = sortedHistory[sortedHistory.length - 1];

    const approvedHistory = sortedHistory.filter(
      (item) => normalizeStatus(item.status) === "approved"
    );

    const latestApprovedUpdate = approvedHistory[approvedHistory.length - 1];

    const currentValue =
      latestApprovedUpdate?.current ??
      userData?.current ??
      kpi.current ??
      0;

    const targetValue =
      userData?.target ??
      kpi.target ??
      0;

    const evidenceCount = sortedHistory.reduce((total, item) => {
      return total + (item.fileNames?.length || item.files?.length || 0);
    }, 0);

    const title = kpi.title || kpi.name || kpi.kpiName || "Untitled KPI";

    return {
      ...kpi,
      title,
      current: currentValue,
      target: targetValue,
      progressText: `${currentValue} / ${targetValue} ${kpi.unit || ""}`,
      deadlineText: kpi.deadline
        ? `${Math.ceil(
            (new Date(kpi.deadline) - new Date()) / (1000 * 60 * 60 * 24)
          )} days left`
        : "No deadline",
      categoryId: kpi.categoryId || category?.id || "",
      categoryName,
      categoryColor: category?.color || kpi.categoryColor || "#e5e7eb",
      status: normalizeStatus(kpi.status || latestUpdate?.status || "pending"),
      evidenceCount,
      evidence: `${evidenceCount} file${evidenceCount === 1 ? "" : "s"}`,
      updatedAt: latestUpdate?.submittedAt || kpi.updatedAt || null,
      notes: latestUpdate?.notes || "",
      submissionHistory: sortedHistory,
    };
  });

  const filteredKPIs = userKpis.filter((kpi) => {
    const searchValue = normalizeText(searchKPI);

    const matchSearch =
      searchValue === "" ||
      normalizeText(kpi.title).includes(searchValue) ||
      normalizeText(kpi.description).includes(searchValue) ||
      normalizeText(kpi.categoryName).includes(searchValue);

    const selectedCategory = normalizeText(filterCategory);
    
    const matchCategory =
      selectedCategory === "" ||
      selectedCategory === "all" ||
      selectedCategory === "all categories" ||
      normalizeText(kpi.categoryName) === selectedCategory ||
      normalizeText(CATEGORY_NAME_MAP[kpi.categoryId]) === selectedCategory ||
      normalizeText(CATEGORY_NAME_MAP[kpi.category]) === selectedCategory ||
      normalizeText(kpi.categoryId) === selectedCategory ||
      normalizeText(kpi.category) === selectedCategory;

    const selectedStatus = normalizeStatus(filterStatus);

    const matchStatus =
      selectedStatus === "" ||
      selectedStatus === "all" ||
      selectedStatus === "all_status" ||
      normalizeStatus(kpi.status) === selectedStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const loadRealData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first before loading KPI data");
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const savedUser = localStorage.getItem("user");

      const [kpiRes, submissionRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/staff/kpi`, {
          method: "GET",
          headers,
        }),
        fetch(`${API_BASE_URL}/api/staff/kpi/submissions`, {
          method: "GET",
          headers,
        }),
      ]);

      if (!kpiRes.ok) {
        const errText = await kpiRes.text();
        console.error("KPI API error:", kpiRes.status, errText);
        throw new Error(`Failed to fetch KPI data. Status: ${kpiRes.status}`);
      }

      if (!submissionRes.ok) {
        const errText = await submissionRes.text();
        console.error("Submission API error:", submissionRes.status, errText);
        throw new Error(`Failed to fetch submission data. Status: ${submissionRes.status}`);
      }

      const kpiData = await kpiRes.json();
      const submissionData = await submissionRes.json();

      const realKpis = Array.isArray(kpiData)
      ? kpiData
      : kpiData.kpis || kpiData.data || [];

      setKpis(realKpis);

      console.log("Current user:", currentUser);
      console.log("Current user id:", currentUserId);
      console.log("Real KPIs:", realKpis);

      const realSubmissionsRaw = Array.isArray(submissionData)
        ? submissionData
        : submissionData.submissions || submissionData.data || [];

      const realSubmissions = normalizeSubmissions(realSubmissionsRaw);

      setSubmissions(realSubmissions);
      setSubmissionHistory(groupSubmissionsByKpi(realSubmissions));

      setCategories([]);

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load database data");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadRealData(false);
  }, []);

  console.log(categories);

  const dashboardKpis = userKpis;
  const totalAssignedKpi = dashboardKpis.length;

   const stats = [
    {
      title: "Total KPIs",
      value: totalAssignedKpi,
      subtitle: "All defined KPIs",
      color: "#3b82f6"
    },
    {
      title: "Active KPIs",
      value: kpis.filter(k => k.status === "in_progress").length,
      subtitle: "Currently in progress",
      color: "#22c55e"
    },
    {
      title: "Completed",
      value: kpis.filter(k => k.status === "completed").length,
      subtitle: "Finished KPIs",
      color: "#facc15"
    },
    {
      title: "High Priority",
      value: kpis.filter(k => k.priority === "high").length || 0,
      subtitle: "Requires attention",
      color: "#ef4444"
    }
  ];

  const handleSubmitUpdate = async (updateData) => {
    try {
      const formData = new FormData();

      formData.append("kpiId", updateData.kpiId);
      formData.append("current", updateData.current);
      formData.append("notes", updateData.notes || "");

      updateData.files?.forEach((file) => {
        formData.append("files", file);
      });

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first before updating KPI progress");
      }

      const response = await fetch(`${API_BASE_URL}/api/kpi/update`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update KPI progress");
      }

      const result = await response.json();
      const newSubmission = normalizeSubmissions([result.submission])[0];

      setSubmissionHistory((prev) => {
        const oldHistory = prev[newSubmission.kpiId] || [];

        return {
          ...prev,
          [newSubmission.kpiId]: [...oldHistory, newSubmission],
        };
      });

      setSubmissions((prev) => [...prev, newSubmission]);

      alert("Progress updated successfully!");
      setSelectedKpi(null);

      // reload latest database data after submission
      loadRealData(true);
    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to update progress. Please check backend.");
    }
  };

 return(
  <div
    className="d-flex"
    style={{
      flexDirection:"column",
      padding: "0 20px 20px 20px",
      width: "100%"
    }}>

      <div style={{ marginBottom: "20px" }}>
        {loading && <span>Loading KPI data...</span>}
        {error && <span style={{ color: "red" }}>{error}</span>}
      </div>

      {/*content*/}

      <div
        style={{
           width: "100%",
           marginBottom:"20px",
        }}>
        <StaffOverallProgress kpis={userKpis} />
      </div>

      {/*4 dashboard cards*/}
      <div style={{ width: "100%" }}>
        <DashboardCards stats={stats} />
      </div>
      
      {/* Search and Filter section wrapper */}
      <div style={{ 
        width: "100%",
        marginTop: "10px",
        display: "flex",
        justifyContent: "stretch"
      }}>
        <div style={{ flex: 1 }}>
          <StaffSearchFilterKPI
            searchKPI={searchKPI}
            setSearchKPI={setSearchKPI}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        </div>
      </div>


       <div
        style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",  
        gap: "16px",
        marginTop:"30px",
        width: "100%"
      }}
      >
     {filteredKPIs.map((kpi) => (
       <StaffKPI 
       key={kpi.id} 
       kpi={kpi}
       onUpdate={() => setSelectedKpi(kpi)} />
    ))}

    <UpdateKpiModal
      kpi={selectedKpi}
      onClose={() => setSelectedKpi(null)}
      onSubmit={handleSubmitUpdate}
      history={selectedKpi ? submissionHistory[selectedKpi.id] || [] : []}
    />
     </div>
      
    
  </div>
 )
};

export default StaffKPIUpdate;