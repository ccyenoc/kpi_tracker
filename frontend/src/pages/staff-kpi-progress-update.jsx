import React, { useEffect, useState } from 'react';
import DashboardCards from "../components/4x1_cards_layout";
import { Target, CheckCircle, TrendingUp, AlertCircle, Clock } from "lucide-react";
import StaffOverallProgress from "../components/staff_overall_progress";
import StaffSearchFilterKPI from "../components/staff_search_filter_kpi"
import StaffKPI from "../components/staff_kpi";
import UpdateKpiModal from "../components/staff_update_kpi"
{/*mock data*/}
import { kpis } from "../data/kpiData";
import { categories } from "../data/categoriesData"; // adjust path if needed
import { submissions } from "../data/submissionData"; // if you're using this too
import { useParams } from "react-router-dom";

const StaffKPIUpdate = () => {
  const { kpiId } = useParams();
  
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState(() => {
    const saved = localStorage.getItem("kpiSubmissionHistory");
    return saved ? JSON.parse(saved) : {};
  });
  const [progressUpdates, setProgressUpdates] = useState({});
  const currentUserId = "user_101";
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
  .filter(kpi => kpi.assignedUserIds.includes(currentUserId))
  .map(kpi => {
    const userData = kpi.kpiAssignments.find(
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

  useEffect(() => {
    const fetchSubmissionHistory = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8006/api/kpi/submissions");
        const result = await response.json();

        if (result.success) {
          const groupedHistory = {};

          result.submissions.forEach((submission) => {
            if (!groupedHistory[submission.kpiId]) {
              groupedHistory[submission.kpiId] = [];
            }

            groupedHistory[submission.kpiId].push(submission);
          });

          setSubmissionHistory(groupedHistory);
        }
      } catch (error) {
        console.error("Failed to load submission history:", error);
      }
    };

    fetchSubmissionHistory();
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
      const formData = new FormData();

      formData.append("kpiId", updateData.kpiId);
      formData.append("current", updateData.current);
      formData.append("notes", updateData.notes || "");

      updateData.files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("http://127.0.0.1:8006/api/kpi/update", {
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

        const updatedHistory = {
          ...prev,
          [newSubmission.kpiId]: [...oldHistory, newSubmission],
        };

        /*localStorage.setItem(
          "kpiSubmissionHistory",
          JSON.stringify(updatedHistory)
        );*/

        return updatedHistory;
      });

      alert("Progress updated successfully!");
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