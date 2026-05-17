import React, { useEffect, useState } from 'react';
import { kpis as mockKpis } from "../data/kpiData";
import { activityLogs as mockActivityLogs } from "../data/activityLog";
import { submissions as mockSubmissions } from "../data/submissionData";
import { useNavigate } from "react-router-dom";
import DashboardCards from "../components/4x1_cards_layout";
import StaffMonthlyPerformanceGraph from '../components/staff_monthly_performance_graph';
import StaffKPIAssignedCard from "../components/staff_kpi_assigned_card";
import StaffRecentActivity from '../components/staff_recent_activity';

const StaffDashboard = () => {


  const API_BASE_URL = '';
  
  const [dataMode, setDataMode] = useState(() => {
    return localStorage.getItem("kpiDataMode") || "mock";
  });

  const [kpis, setKpis] = useState(mockKpis);
  const [submissions, setSubmissions] = useState(mockSubmissions);
  const [activityLogs, setActivityLogs] = useState(mockActivityLogs);
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

  const currentUserId =
    dataMode === "mock" ? "user_101" : currentUser?.id || "user_101";

  const goUpdate = (kpiId) => {
    navigate(`/staff/kpi/${kpiId}`);
  };

  const useMockData = () => {
    localStorage.setItem("kpiDataMode", "mock");
    setDataMode("mock");
    setKpis(mockKpis);
    setSubmissions(mockSubmissions);
    setActivityLogs(mockActivityLogs);
    setError("");
  };

  const useRealData = async () => {
    try {
      setLoading(true);
      setError("");
      localStorage.setItem("kpiDataMode", "real");
      setDataMode("real");

      const [kpiRes, submissionRes, activityRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/kpi`),
        fetch(`${API_BASE_URL}/api/kpi/submissions`),
        fetch(`${API_BASE_URL}/api/activity-logs`)
      ]);

      if (!kpiRes.ok) throw new Error("Failed to fetch KPI data");
      if (!submissionRes.ok) throw new Error("Failed to fetch submission data");
      if (!activityRes.ok) throw new Error("Failed to fetch activity logs");

      const kpiData = await kpiRes.json();
      const submissionData = await submissionRes.json();
      const activityData = await activityRes.json();

      setKpis(kpiData.kpis || []);
      setSubmissions(submissionData.submissions || []);
      setActivityLogs(activityData.activityLogs || []);
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
      } catch (err) {
        console.error(err);
      }
    };

    fetchCurrentUser();
  }, []);
    
  const userKpis = kpis
  .filter(kpi => kpi.assignedUserIds.includes(currentUserId))
  .map(kpi => {
    const userData = kpi.kpiAssignments.find(
      u => u.userId === currentUserId
    );

    return {
      ...kpi,
      progressText: `${userData?.current || 0} / ${userData?.target || 0} ${kpi.unit}`,
      deadlineText: `${Math.ceil(
        (new Date(kpi.deadline) - new Date()) / (1000 * 60 * 60 * 24)
      )} days left`
    };
  });

  const userActivities = activityLogs
  .filter(activity => activity.userId === currentUserId)
  .map(activity => {

    return {
      ...activity,
      title: activity.meta.kpiTitle 
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

  const submissionMap = Object.fromEntries(
  submissions.map(s => [s.kpiId, s])
);

  const getWeekOfMonth = (date) => {
  const day = date.getDate();
  return Math.ceil(day / 7);
};

const weeklyMap = {};

userKpis.forEach(kpi => {
  const submission = submissionMap[kpi.id];
  if (!submission) return;

  const date = new Date(submission.submittedAt);
  const month = date.toLocaleString("default", { month: "short" });
  const week = getWeekOfMonth(date);

  const key = `${month}-W${week}`;

  if (!weeklyMap[key]) {
    weeklyMap[key] = {
      name: kpi.title,
      month,
      time: `Week ${week}`,
      kpi: 0,
      progress: 0,
      prediction: 0
    };
  }


  const userData = kpi.kpiAssignments.find(u => u.userId === currentUserId);
  const targetVal = userData?.target || 0;
  const currentVal = userData?.current || 0;

  weeklyMap[key].kpi += targetVal;
  weeklyMap[key].progress += currentVal;
  weeklyMap[key].prediction += currentVal + 5;
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
      name: "",
      month: selectedMonth,
      time: weekLabel,
      kpi: 0,
      progress: 0,
      prediction: 0
    };
  });
}

  {/*DASHBOARD DATA*/}
  const total = kpis.length;
  const completed = kpis.filter(k => k.status === "completed").length;
  const completionRate = total === 0
  ? 0
  : Math.round((completed / total) * 100);

  const today = new Date();

  const upcoming = kpis.filter(k => {
  const deadline = new Date(k.deadline);
  const diffDays = (deadline - today) / (1000 * 60 * 60 * 24);

  return (
    k.status !== "completed" &&
    diffDays >= 0 &&
    diffDays <= 7
  );
});

  const stats = [
  {
    title: "Total KPIs",
    value: kpis.length,
    subtitle: "All defined KPIs",
    color: "#3b82f6"
  },
  {
    title: "Completion Rate",
    value: `${completionRate}%`,
    subtitle: `${completed} of ${total} completed`,
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
    value: kpis.filter(k => k.priority === "high").length || 0,
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
            Welcome back, {dataMode === "mock" ? "John" : currentUser?.name || "Staff"}!
          </h2>
        </div>

        <div style={{ padding: "0 20px 20px 20px", display: "flex", gap: "10px", alignItems: "center" }}>
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