import React, { useEffect, useState } from 'react';
import DashboardCards from "../../components/common/4x1_cards_layout";
import StaffOverallProgress from "../../components/staff/kpi_progress_update/staff_overall_progress";
import StaffSearchFilterKPI from "../../components/common/staff_search_filter_kpi"
import StaffKPI from "../../components/staff/kpi_progress_update/staff_kpi";
import UpdateKpiModal from "../../components/staff/kpi_progress_update/staff_update_kpi"
import { useParams } from "react-router-dom";
import { useAuth } from "../../Auth.jsx";
import { kpi } from "../../api/api";

const StaffKPIUpdate = () => {
  const { kpiId } = useParams();

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
    return useAuth()?.user || JSON.parse(localStorage.getItem("user")) || null;
  });

  const currentUserId = String(currentUser?.id || currentUser?.user_id || "");
  const toDate = (value) => {
    if (!value) return null;

    if (typeof value.toDate === "function") {
      return value.toDate();
    }

    if (value._seconds) {
      return new Date(value._seconds * 1000);
    }

    const parsedDate = new Date(value);

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  const getTimeBasedStatus = ({
    progress,
    assignedAt,
    createdAt,
    deadline,
    latestSubmissionStatus
  }) => {
   // show pending approval first
    if (latestSubmissionStatus === "pending") {
      return {
        status: "pending",
        expectedProgress: null
      };
    }

    // target completed by this staff
    if (progress >= 100) {
      return {
        status: "completed",
        expectedProgress: 100
      };
    }

    const startDate = toDate(assignedAt || createdAt);
    const deadlineDate = toDate(deadline);
    const today = new Date();

    // handle missing dates
    if (!startDate || !deadlineDate || deadlineDate <= startDate) {
      return {
        status: progress > 0 ? "in_progress" : "in_progress",
        expectedProgress: null
      };
    }

    const totalDuration = deadlineDate - startDate;
    const elapsedDuration = Math.max(
      0,
      Math.min(today - startDate, totalDuration)
    );

    const expectedProgress = Math.min(
      100,
      Math.round((elapsedDuration / totalDuration) * 100)
    );

   // overdue and still incomplete
    if (today > deadlineDate) {
      return {
        status: "underperformed",
        expectedProgress
      };
    }

    const progressGap = progress - expectedProgress;

    if (progressGap >= -10) {
      return {
        status: "in_progress",
        expectedProgress
      };
    }

    if (progressGap >= -25) {
      return {
        status: "at_risk",
        expectedProgress
      };
    }

    return {
      status: "underperformed",
      expectedProgress
    };
  };
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

    console.log("KPI Object:");
    console.log(kpi);

    const category = categoryMap[kpi.categoryId];
    const categoryName =
    kpi.categoryName ||
    categoryMap[kpi.categoryId]?.name ||
    getCategoryName(kpi);

    const categoryColor =
    categoryMap[kpi.categoryId]?.color ||
    kpi.categoryColor ||
    "#e5e7eb";

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

    const progress =
      Number(targetValue) > 0
        ? Math.min(
            100,
            Math.round((Number(currentValue) / Number(targetValue)) * 100)
          )
        : 0;

    const latestSubmission = sortedHistory[sortedHistory.length - 1];

    const latestSubmissionStatus = String(
      latestSubmission?.status || ""
    ).toLowerCase();

    const { status: displayStatus, expectedProgress } = getTimeBasedStatus({
      progress,
      assignedAt: userData?.assignedAt,
      createdAt: kpi.createdAt,
      deadline: kpi.deadline,
      latestSubmissionStatus
    });

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
      categoryColor,
      status: displayStatus,
      progress,
      expectedProgress,
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

      const [kpiData, submissionData] = await Promise.all([
        kpi.fetchStaffKPIs(),
        kpi.fetchStaffKPISubmissions(),
      ]);

      const rawKpis = Array.isArray(kpiData)
 ? kpiData
 : kpiData.kpis || kpiData.data || [];

const realKpis =
rawKpis.map((kpi) => ({
  id:
    kpi.id ||
    kpi.kpiId ||
    kpi.documentId ||
    kpi._id,

  title:
    kpi.title ||
    kpi.kpiTitle ||
    "Untitled KPI",

  ...kpi
}));

setKpis(realKpis);

console.log("REAL KPI");
console.log(realKpis);


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
  const summaryKpis = userKpis.map((kpi) => ({
    ...kpi,
    status:
      normalizeStatus(kpi.status) === "completed"
        ? "completed"
        : "in_progress"
  }));

  const totalAssignedKpi = summaryKpis.length;

  const activeKpiCount = summaryKpis.filter(
    (kpi) => normalizeStatus(kpi.status) === "in_progress"
  ).length;

  const completedKpiCount = summaryKpis.filter(
    (kpi) => normalizeStatus(kpi.status) === "completed"
  ).length;

  const underperformed = dashboardKpis.filter(
      (kpi) => kpi.status === "underperformed"
    ).length;
    
  const stats = [
    {
      title: "Total KPIs",
      value: totalAssignedKpi,
      subtitle: "Assigned KPIs",
      color: "#3b82f6"
    },
    {
      title: "Active KPIs",
      value: activeKpiCount,
      subtitle: "Currently in progress",
      color: "#22c55e"
    },
    {
      title: "Completed",
      value: completedKpiCount,
      subtitle: "Finished KPIs",
      color: "#facc15"
    },
    {
      title: "High Priority",
      value: underperformed,
      subtitle: "Requires attention",
      color: "#ef4444"
    }
  ];

  const handleSubmitUpdate = async (updateData) => {
    try {
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first before updating KPI progress.");
      }

      const response = await fetch("/api/kpi/update", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: updateData,
      });

      const text = await response.text();

      if (!text.trim()) {
        throw new Error(
          `Backend returned an empty response. Status: ${response.status}`
        );
      }

      let result;

      try {
        result = JSON.parse(text);
      } catch {
        throw new Error(
          `Backend returned invalid JSON. Status: ${response.status}`
        );
      }

      if (!response.ok || result.success === false) {
        throw new Error(
          result.detail ||
          result.message ||
          "Failed to update KPI progress."
        );
      }

      if (!result.submission) {
        throw new Error("Backend did not return submission data.");
      }

      const newSubmission = normalizeSubmissions([result.submission])[0];

      setSubmissionHistory((prev) => {
        const oldHistory = prev[newSubmission.kpiId] || [];

        return {
          ...prev,
          [newSubmission.kpiId]: [...oldHistory, newSubmission],
        };
      });

      setSubmissions((prev) => [...prev, newSubmission]);

      await loadRealData(true);

      return result;
    } catch (error) {
      console.error("Error updating KPI progress:", error);
      setError(error.message || "Failed to update KPI progress.");
      throw error;
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
        onUpdate={() => {
          if (normalizeStatus(kpi.status) !== "completed") {
            setSelectedKpi(kpi);
          }
        }}
      />
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