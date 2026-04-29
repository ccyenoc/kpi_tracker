import React, { useState } from 'react';
import { kpis } from "../data/kpiData";
import DashboardCards from "../components/4x1_cards_layout";
import StaffMonthlyPerformanceGraph from '../components/staff_monthly_performance_graph';
import StaffKPIAssignedCard from "../components/staff_kpi_assigned_card";
import { activityLogs, getTimeAgo } from "../data/activityLog";
import StaffRecentActivity from '../components/staff_recent_activity';
{/*import mock data*/}
import { submissions } from "../data/submissionData";

const StaffDashboard = () => {

  {/*DATA*/}
  {/*MOCK USER*/}
  const currentUserId = "user_101";
   
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

  weeklyMap[key].kpi += kpi.target;
  weeklyMap[key].progress += kpi.current;
  weeklyMap[key].prediction += kpi.current + 5;
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
    <div>
    

      <div className="d-flex" 
        style={{
          width: "100%",
          flexDirection:"column",
            display: "flex",
      }}>
      {/* welcome message */}
        <div>
          <h2
            style={{
              padding:"20px",
              marginTop:"0px",
            }}>Welcome back, John!</h2>
        </div>

      {/*top 4 cards*/}
       <DashboardCards stats={stats} />

      {/*monthly performance graph + kpi assigned*/}
      <div
        className="d-flex"
        style={{
          marginLeft:"20px",
          flexDirection:"row",
          gap:"20px",
        }}>
      <StaffMonthlyPerformanceGraph 
       graphData={graphData}
       selectedMonth={selectedMonth}
       setSelectedMonth={setSelectedMonth}
      />
      <StaffKPIAssignedCard kpis={userKpis} />
      </div>

     <div 
       style={{
        marginLeft:"20px",
        marginBottom:"40px",
       }}>
      <StaffRecentActivity userActivities={userActivities}/>
    </div>

      
</div>
    
</div>

)};

export default StaffDashboard;