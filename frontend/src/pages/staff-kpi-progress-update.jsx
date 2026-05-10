import React, { useEffect, useState } from 'react';
import DashboardCards from "../components/4x1_cards_layout";
import { Target, CheckCircle, TrendingUp, AlertCircle, Clock } from "lucide-react";
import StaffOverallProgress from "../components/staff_overall_progress";
import StaffSearchFilterKPI from "../components/staff_search_filter_kpi"
import StaffKPI from "../components/staff_kpi";
import UpdateKpiModal from "../components/staff_update_kpi"
{/*mock data*/}
import { kpis as mockKpis } from "../data/kpiData";
import { categories as mockCategories } from "../data/categoriesData";
import { submissions as mockSubmissions } from "../data/submissionData";
import { useParams } from "react-router-dom";

const StaffKPIUpdate = () => {
  const { kpiId } = useParams();
  
  const API_BASE_URL = "http://127.0.0.1:8006";

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

  const [dataMode, setDataMode] = useState(() => {
    return localStorage.getItem("kpiDataMode") || "mock";
  });

  const [kpis, setKpis] = useState(mockKpis);
  const [categories, setCategories] = useState(mockCategories);
  const [submissions, setSubmissions] = useState(mockSubmissions);

  const [selectedKpi, setSelectedKpi] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState(() =>
    groupSubmissionsByKpi(mockSubmissions)
  );

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const currentUserId =
    dataMode === "mock" ? "user_101" : currentUser?.id || "user_101";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchKPI, setSearchKPI] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const categoryMap = Object.fromEntries(
    categories.map(c => [c.id, c])
    );

  const submissionMap = Object.fromEntries(
  submissions.map(s => [s.kpiId, s])
  );

  const userKpis = kpis
  .filter(kpi => (kpi.assignedUserIds || []).includes(currentUserId))
  .map(kpi => {
    
    const userData = (kpi.kpiAssignments || []).find(
      u => u.userId === currentUserId
    );

    const category = categoryMap[kpi.categoryId];
    const submission = submissionMap[kpi.id];

    const history = submissionHistory[kpi.id] || [];
    const latestUpdate = history[history.length - 1];

    const currentValue = latestUpdate?.current ?? userData?.current ?? 0;
    const targetValue = userData?.target || 0;

    const evidenceCount =
      history.reduce((total, item) => {
        return total + (item.fileNames?.length || 0);
      }, 0);

    const newStatus = kpi.status;

    return {
      ...kpi,

      // progress
      current: currentValue,
      target: targetValue,

      progressText: `${currentValue} / ${targetValue} ${kpi.unit}`,

      deadlineText: `${Math.ceil(
        (new Date(kpi.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      )} days left`,

      categoryName: category?.name || "General",
      categoryColor: category?.color || "#e5e7eb",

    
      status: latestUpdate ? newStatus : kpi.status,

      evidenceCount: evidenceCount,
      evidence: `${evidenceCount} file${evidenceCount === 1 ? "" : "s"}`,

      updatedAt: latestUpdate?.submittedAt || submission?.submittedAt || null,
      notes: latestUpdate?.notes || "",
      submissionHistory: history
    };

  
  });
  const filteredKPIs = userKpis.filter(kpi => {
    const matchSearch =
        searchKPI === "" ||
        kpi.title.toLowerCase().includes(searchKPI.toLowerCase());

    const matchCategory =
      filterCategory === "" ||
      kpi.categoryName === filterCategory;

    const matchStatus =
      filterStatus === "" ||
      kpi.status === filterStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  const useMockData = () => {
    localStorage.setItem("kpiDataMode", "mock");
    setDataMode("mock");

    setKpis(mockKpis);
    setCategories(mockCategories);
    setSubmissions(mockSubmissions);
    setSubmissionHistory(groupSubmissionsByKpi(mockSubmissions));

    setError("");
  };

  const useRealData = async () => {
    try {
      setLoading(true);
      setError("");

      localStorage.setItem("kpiDataMode", "real");
      setDataMode("real");

      const [kpiRes, submissionRes, categoryRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/kpi`),
        fetch(`${API_BASE_URL}/api/kpi/submissions`),
        fetch(`${API_BASE_URL}/api/categories`)
      ]);

      if (!kpiRes.ok) throw new Error("Failed to fetch KPI data");
      if (!submissionRes.ok) throw new Error("Failed to fetch submission data");
      if (!categoryRes.ok) throw new Error("Failed to fetch category data");

      const kpiData = await kpiRes.json();
      const submissionData = await submissionRes.json();
      const categoryData = await categoryRes.json();

      const realKpis = kpiData.kpis || [];
      const realSubmissions = submissionData.submissions || [];
      const realCategories = categoryData.categories || [];

      setKpis(realKpis);
      setSubmissions(realSubmissions);
      setCategories(realCategories);
      setSubmissionHistory(groupSubmissionsByKpi(realSubmissions));
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load real data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error("Failed to fetch current user");
        }

        const data = await res.json();

        setCurrentUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (err) {
        console.error(err);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const savedMode = localStorage.getItem("kpiDataMode") || "mock";

    if (savedMode === "real") {
      useRealData();
    } else {
      useMockData();
    }
  }, []);

  

  console.log(categories);






   const stats = [
    {
      title: "Total KPIs",
      value: kpis.length,
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
      if (dataMode === "mock") {
        const newSubmission = {
          id: `mock_${Date.now()}`,
          kpiId: updateData.kpiId,
          current: Number(updateData.current),
          notes: updateData.notes || "",
          fileNames: updateData.files?.map((file) => file.name) || [],
          files: [],
          submittedAt: new Date().toISOString(),
          status: "pending"
        };

        setSubmissionHistory((prev) => {
          const oldHistory = prev[newSubmission.kpiId] || [];

          return {
            ...prev,
            [newSubmission.kpiId]: [...oldHistory, newSubmission]
          };
        });

        setSubmissions((prev) => [...prev, newSubmission]);

        alert("Mock progress updated successfully!");
        setSelectedKpi(null);
        return;
      }

      const formData = new FormData();

      formData.append("kpiId", updateData.kpiId);
      formData.append("current", updateData.current);
      formData.append("notes", updateData.notes || "");

      updateData.files?.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(`${API_BASE_URL}/api/kpi/update`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update KPI progress");
      }

      const result = await response.json();
      const newSubmission = result.submission;

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
    } catch (error) {
      console.error(error);
      alert("Failed to update progress. Please check backend.");
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

      <div
        style={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          marginBottom: "20px"
        }}
      >
        <button
          onClick={useMockData}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: dataMode === "mock" ? "#3b82f6" : "#e5e7eb",
            color: dataMode === "mock" ? "#ffffff" : "#111827"
          }}
        >
          Use Mock Data
        </button>

        <button
          onClick={useRealData}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor: dataMode === "real" ? "#22c55e" : "#e5e7eb",
            color: dataMode === "real" ? "#ffffff" : "#111827"
          }}
        >
          Use Real Data
        </button>

        {loading && <span>Loading real data...</span>}
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