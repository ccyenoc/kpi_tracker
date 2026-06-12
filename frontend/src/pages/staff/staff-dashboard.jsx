import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import DashboardCards from "../../components/common/4x1_cards_layout";
import StaffMonthlyPerformanceGraph from '../../components/staff/kpi_dashboard/staff_monthly_performance_graph';
import StaffKPIAssignedCard from "../../components/staff/kpi_dashboard/staff_kpi_assigned_card";
import StaffRecentActivity from '../../components/staff/kpi_dashboard/staff_recent_activity';
import { useAuth } from "../../Auth.jsx";
import { kpi } from "../../api/api";


const StaffDashboard = () => {
  const [kpis, setKpis] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  const [predictions, setPredictions] = useState({});
  const [monthlyPerformance, setMonthlyPerformance] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const auth = useAuth();
  const [currentUser, setCurrentUser] = useState(() => {
    return auth?.user || JSON.parse(localStorage.getItem("user")) || null;
  });

  const currentUserId = currentUser?.id || currentUser?.user_id || "";

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
    // A submitted update waiting for manager approval has priority
    if (latestSubmissionStatus === "pending") {
      return {
        status: "pending",
        expectedProgress: null
      };
    }

    // Individual staff completed their own assigned target
    if (progress >= 100) {
      return {
        status: "completed",
        expectedProgress: 100
      };
    }

    const startDate = toDate(assignedAt || createdAt);
    const deadlineDate = toDate(deadline);
    const today = new Date();

    // Fallback when dates are unavailable
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

    // Deadline already passed but this staff member is not completed
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
        throw new Error(
          "Please login first before loading dashboard data"
        );
      }

      const [kpiData, submissionData] = await Promise.all([
        kpi.fetchStaffKPIs(),
        kpi.fetchStaffKPISubmissions()
      ]);

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

      const sortedHistory = [...history].sort(
        (a, b) => new Date(a.submittedAt || 0) - new Date(b.submittedAt || 0)
      );

      const approvedHistory = sortedHistory.filter(
        (item) => String(item.status || "").toLowerCase() === "approved"
      );

      const latestApprovedUpdate = approvedHistory[approvedHistory.length - 1];

      const currentValue =
        latestApprovedUpdate?.current ??
        userData?.current ??
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

      return {
        ...kpi,
        current: currentValue,
        target: targetValue,
        progress,
        expectedProgress,
        status: displayStatus,
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
  });

  useEffect(() => {
    let mounted = true;

    const fetchPredictionsAndPerformance = async () => {
      try {
        const [predData, perfData] = await Promise.all([
          kpi.fetchStaffKpiPredictions(),
          kpi.fetchStaffMonthlyPerformance()
        ]);

        if (mounted) {
          if (predData && Array.isArray(predData.predictions)) {
            const map = Object.fromEntries(
              predData.predictions.map((p) => [
                String(p.kpi_id),
                Number(p.predicted_progress || 0)
              ])
            );
            setPredictions(map);
          }

          if (perfData && perfData.success && Array.isArray(perfData.data)) {
            setMonthlyPerformance(perfData.data);
          }
        }
      } catch (err) {
        console.error("Error loading predictions or performance data", err);
      }
    };

    fetchPredictionsAndPerformance();
    return () => { mounted = false; };
  }, [userKpis]);

  let graphData;

  // Map backend monthly performance records to Recharts compatible percentage keys
  const backendMap = {};
  monthlyPerformance.forEach(item => {
    const key = `${item.month}-${item.time.replace("Week ", "W")}`;
    const targetVal = Number(item.kpi || 0);
    const progressVal = Number(item.progress || 0);
    const predictionVal = Number(item.prediction || 0);

    const progressPct = targetVal > 0 ? Math.min(100, Math.round((progressVal / targetVal) * 100)) : 0;
    const predictionPct = targetVal > 0 ? Math.min(100, Math.round((predictionVal / targetVal) * 100)) : 0;

    backendMap[key] = {
      ...item,
      kpi: 100,
      progress: progressPct,
      prediction: predictionPct
    };
  });

  if (selectedMonth === "All") {
    graphData = monthlyPerformance.length > 0 
      ? Object.values(backendMap) 
      : Object.values(weeklyMap);
  } else {
    const weeks = getWeeksInMonth(selectedMonth);

    graphData = weeks.map((weekLabel, index) => {
      const weekNumber = index + 1;
      const key = `${selectedMonth}-W${weekNumber}`;
      const matched = backendMap[key] || weeklyMap[key];

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

  // Calculate average predicted progress for all assigned KPIs from prediction service
  let totalPredictedPercent = 0;
  userKpis.forEach(kpi => {
    const predVal = predictions[String(kpi.id)];
    if (predVal !== undefined) {
      totalPredictedPercent += predVal;
    } else {
      const targetVal = Number(kpi.target || 0);
      const currentVal = Number(kpi.current || 0);
      const progressPercent = targetVal > 0 ? Math.min(100, Math.round((currentVal / targetVal) * 100)) : 0;
      totalPredictedPercent += Math.min(100, progressPercent + 5);
    }
  });
  const averagePrediction = totalAssignedKpi > 0 ? Math.round(totalPredictedPercent / totalAssignedKpi) : 0;

  // Apply smooth linear prediction trajectory across all graph points (prevents drop-offs to 0 on empty weeks)
  if (graphData && graphData.length > 0) {
    graphData = graphData.map((item, index) => {
      const pointNumber = index + 1;
      return {
        ...item,
        prediction: Math.min(100, Math.round((averagePrediction / graphData.length) * pointNumber))
      };
    });
  }

  {/*DASHBOARD DATA*/ }
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
      value: underperformed,
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
        {/* TODO: Change to use PageTitle Component */}
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
              maxHeight: "500px",
            }}>
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
            <StaffKPIAssignedCard kpis={userKpis} onUpdate={goUpdate} />
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
          <StaffRecentActivity userActivities={userActivities} />
        </div>

      </div>
    </div>
  )
};

export default StaffDashboard;