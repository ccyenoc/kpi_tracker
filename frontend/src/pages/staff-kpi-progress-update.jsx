import React, { useState } from 'react';
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

const StaffKPIUpdate = () => {
  const [selectedKpi, setSelectedKpi] = useState(null);
  
  const currentUserId = "user_101";

  console.log(categories);
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

    return {
      ...kpi,

      // progress
      current: userData?.current || 0,
      target: userData?.target || 0,

      progressText: `${userData?.current || 0} / ${userData?.target || 0} ${kpi.unit}`,

      deadlineText: `${Math.ceil(
        (new Date(kpi.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      )} days left`,

      categoryName: category?.name || "General",
      categoryColor: category?.color || "#e5e7eb",

    
      evidenceCount: submission ? 1 : 0,
      updatedAt: submission?.submittedAt || null
    };

  
  });


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
          <StaffSearchFilterKPI />
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
     {userKpis.map((kpi) => (
       <StaffKPI 
       key={kpi.id} 
       kpi={kpi}
       onUpdate={() => setSelectedKpi(kpi)} />
    ))}

    <UpdateKpiModal
  kpi={selectedKpi}
  onClose={() => setSelectedKpi(null)}
/>
     </div>
      
    
  </div>
 )
};

export default StaffKPIUpdate;