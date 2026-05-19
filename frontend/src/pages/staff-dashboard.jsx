import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import DashboardCards from "../components/4x1_cards_layout";
import StaffMonthlyPerformanceGraph from '../components/staff_monthly_performance_graph';
import StaffKPIAssignedCard from "../components/staff_kpi_assigned_card";
import StaffRecentActivity from '../components/staff_recent_activity';

const StaffDashboard = () => {

  {/*DATA*/}
  {/*MOCK USER*/}
  // In development, use Vite proxy; in production, use absolute URL
  const API_BASE_URL = import.meta.env.MODE === 'development' ? '' : 'http://127.0.0.1:8006';
  
  const [kpis, setKpis] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const currentUserId = currentUser?.id || currentUser?.user_id || "";

  const goUpdate = (kpiId) => {
    navigate(`/staff/kpi/${kpiId}`);
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

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first before loading dashboard data");
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

    const realSubmissionsRaw = Array.isArray(submissionData)
      ? submissionData
      : submissionData.submissions || submissionData.data || [];

    const realSubmissions = normalizeSubmissions(realSubmissionsRaw);

    setKpis(realKpis);
    setSubmissions(realSubmissions);

      setActivityLogs([]);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    };

   useEffect(() => {
      loadDashboardData(false);
    }, []);
  

    const submissionMap = submissions.reduce((map, submission) => {
      const key = submission.kpiId;
      if (!key) return map;

      if (!map[key]) {
        map[key] = [];
      }

      map[key].push(submission);
      return map;
    }, {});
      
    const userKpis = kpis
    .filter(kpi => {
      const assignedUserIds = kpi.assignedUserIds || [];
      const kpiAssignments = kpi.kpiAssignments || [];
      const assignedUsers = kpi.assignedUsers || [];

      return (
        assignedUserIds.includes(currentUserId) ||
        assignedUsers.includes(currentUserId) ||
        kpi.assignedTo === currentUserId ||
        kpi.staffId === currentUserId ||
        kpi.assignedStaffId === currentUserId ||
        kpiAssignments.some(u => u.userId === currentUserId)
      );
    })
    .map(kpi => {
      const userData = (kpi.kpiAssignments || []).find(
        u => u.userId === currentUserId
      );

      const history = submissionMap[kpi.id] || [];

      const approvedHistory = history.filter(
        item => item.status === "approved"
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
        targetValue > 0
          ? Math.min(100, Math.round((Number(currentValue) / Number(targetValue)) * 100))
          : 0;

      return {
        ...kpi,
        current: currentValue,
        target: targetValue,
        progress,
        progressText: `${currentValue} / ${targetValue} ${kpi.unit || ""}`,
        deadlineText: kpi.deadline
          ? `${Math.ceil(
              (new Date(kpi.deadline) - new Date()) / (1000 * 60 * 60 * 24)
            )} days left`
          : "No deadline"
      };
    });

    const kpiTitleMap = Object.fromEntries(
      userKpis.map((kpi) => [
        String(kpi.id),
        kpi.title || kpi.name || kpi.kpiName || "KPI Activity"
      ])
    );

    const userActivities = submissions
      .filter((submission) => {
        return userKpis.some(
          (kpi) => String(kpi.id) === String(submission.kpiId)
        );
      })
      .sort((a, b) => {
        const dateA = new Date(a.submittedAt || a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.submittedAt || b.createdAt || b.updatedAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5)
      .map((submission) => {
        const kpiTitle =
          kpiTitleMap[String(submission.kpiId)] || "KPI Progress Update";

        const submittedDate =
          submission.submittedAt || submission.createdAt || submission.updatedAt;

        return {
          id: submission.id || `${submission.kpiId}-${submittedDate}`,
          userId: currentUserId,
          title: `Update - ${kpiTitle}`,
          description: "Performance update recorded",
          status: submission.status || "pending",

          // keep raw date, do not use toLocaleString here
          time: submittedDate,
          submittedAt: submittedDate,
          createdAt: submittedDate,

          // optional icon info
          icon: "📈",
          iconBg: "#dbeafe"
        };
  });
    const [selectedMonth, setSelectedMonth] = useState(
      new Date().toLocaleString("default", { month: "short" })
    );

    const getWeeksInMonth = (month) => {
    const year = new Date().getFullYear();
    const monthIndex = new Date(`${month} 1, ${year}`).getMonth();

    const lastDay = new Date(year, monthIndex + 1, 0).getDate();
    const totalWeeks = Math.ceil(lastDay / 7);

    return Array.from({ length: totalWeeks }, (_, i) => `Week ${i + 1}`);
  };


    const getWeekOfMonth = (date) => {
      const day = date.getDate();
      return Math.ceil(day / 7);
    };

  const dashboardKpis = userKpis;
  const totalAssignedKpi = dashboardKpis.length;

  const weeklyMap = {};

  userKpis.forEach(kpi => {
    const history = submissionMap[kpi.id] || [];

    const sortedHistory = [...history].sort(
      (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
    );

    const approvedHistory = sortedHistory.filter(
      item => item.status === "approved"
    );

    const latestSubmission =
      approvedHistory[approvedHistory.length - 1] ||
      sortedHistory[sortedHistory.length - 1];

    if (!latestSubmission) return;

    const date = new Date(latestSubmission.submittedAt);
    const month = date.toLocaleString("default", { month: "short" });
    const week = getWeekOfMonth(date);

    const key = `${month}-W${week}`;

    if (!weeklyMap[key]) {
      weeklyMap[key] = {
        name: "Average KPI Progress",
        month,
        time: `Week ${week}`,
        kpi: 100,
        progress: 0,
        prediction: 0,
        totalProgressPercent: 0,
      };
    }

    const targetVal = Number(kpi.target || 0);
    const currentVal = Number(kpi.current || 0);

    const progressPercent =
      targetVal > 0
        ? Math.min(100, Math.round((currentVal / targetVal) * 100))
        : 0;

    weeklyMap[key].totalProgressPercent += progressPercent;
  });

  Object.values(weeklyMap).forEach((item) => {
    item.kpi = 100;

    item.progress =
      totalAssignedKpi > 0
        ? Math.round(item.totalProgressPercent / totalAssignedKpi)
        : 0;

    item.prediction = Math.min(100, item.progress + 5);
  });
  let graphData;

  if (selectedMonth === "All") {
    graphData = Object.values(weeklyMap);
  } else {
    const weeks = getWeeksInMonth(selectedMonth);

    graphData = weeks.map((weekLabel, index) => {
      const weekNumber = index + 1;
      const key = `${selectedMonth}-W${weekNumber}`;
      const matched = weeklyMap[key];

      return matched || {
        name: "Average KPI Progress",
        month: selectedMonth,
        time: weekLabel,
        kpi: 100,
        progress: 0,
        prediction: 0
      };
    });
  }

    {/*DASHBOARD DATA*/}
    const totalPercentage = dashboardKpis.reduce((sum, kpi) => {
      const current = Number(kpi.current || 0);
      const target = Number(kpi.target || 0);

      const percentage = target > 0
        ? Math.min(100, Math.round((current / target) * 100))
        : 0;

      return sum + percentage;
    }, 0);

    const completionRate = totalAssignedKpi > 0
      ? Math.round(totalPercentage / totalAssignedKpi)
      : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = dashboardKpis.filter(k => {
      if (!k.deadline) return false;

      const deadline = new Date(k.deadline);
      deadline.setHours(0, 0, 0, 0);

      const diffDays = (deadline - today) / (1000 * 60 * 60 * 24);

      return (
        k.status !== "completed" &&
        k.progress < 100 &&
        diffDays >= 0 &&
        diffDays <= 7
      );
    });

    const highPriority = dashboardKpis.filter(
      k => (k.priority || "").toLowerCase() === "high"
    ).length;

    const stats = [
      {
        title: "Total KPIs",
        value: totalAssignedKpi,
        subtitle: "Assigned KPIs",
        color: "#3b82f6"
      },
      {
        title: "Completion Rate",
        value: `${completionRate}%`,
        subtitle: `Average progress of ${totalAssignedKpi} KPIs`,
        color: "#22c55e"
      },
      {
        title: "Upcoming Deadlines",
        value: upcoming.length,
        subtitle: "Due in next 7 days",
        color: "#facc15"
      },
      {
        title: "High Priority",
        value: highPriority,
        subtitle: "Requires attention",
        color: "#ef4444"
      }
    ];  

   return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh", width: "100%" }}>
      <div 
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* welcome message */}
        <div 
          style={{ 
            padding: "20px",
            backgroundColor: "#ffffff",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <h2 style={{ margin: 0 }}>
            Welcome back, {currentUser?.name || "Staff"}!
          </h2>
        </div>

        <div style={{ padding: "0 20px 20px 20px" }}>
          {loading && <span>Loading dashboard data...</span>}
          {error && <span style={{ color: "red" }}>{error}</span>}
        </div>


        {/*top 4 cards*/}
        <div style={{ position: "relative" }}>
          <DashboardCards stats={stats} />
        </div>

        {/*monthly performance graph + kpi assigned*/}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            padding: "20px",
            gap: "20px",
            width: "100%",
            boxSizing: "border-box",
            position: "relative"
          }}>
          
          <div 
          style={{ 
            flex: 1, 
            minWidth: 0,
            maxHeight: "500px",}}>
            <StaffMonthlyPerformanceGraph 
              graphData={graphData}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
          </div>

          <div 
          style={{ 
            flex: 1, 
            minWidth: 0,
            maxHeight: "500px",
}}>
               <StaffKPIAssignedCard kpis={userKpis} onUpdate={goUpdate}/>
          </div>
        </div>

        {/*recent activity*/}
       <div 
         style={{
          padding: "20px",
          width: "100%",
          boxSizing: "border-box",
          marginBottom: "40px",
          position: "relative"
         }}>
        <StaffRecentActivity userActivities={userActivities}/>
      </div>

    </div>
  </div>
)};

export default StaffDashboard;