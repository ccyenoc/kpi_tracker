// calculate user performance (KPI + timeliness + quality)
export function calculateUserPerformance(userId, kpis, submissions) {

  // KPI filtering
  const userKpi = (kpis || []).filter(
    kpi => kpi.assignedUserIds.includes(userId)
  );

  let totalProgress = 0;
  let count = 0;

  userKpi.forEach(kpi => {
    const assignment = kpi.kpiAssignments.find(
      a => a.userId === userId
    );

    if (assignment && assignment.target > 0) {
      const progress = (assignment.current / assignment.target) * 100;
      totalProgress += progress;
      count++;
    }
  });

  const kpiScore = count ? totalProgress / count : 0;

  // Timeliness
  const userSubs = (submissions || []).filter(
    sub => sub.userId === userId
  );

  const completed = userSubs.filter(
    sub => sub.status === "Completed"
  ).length;

  const timelinessScore = userSubs.length
    ? (completed / userSubs.length) * 100
    : 0;

  // Quality (reuse KPI for now)
  const qualityScore = kpiScore;

  return { kpiScore, timelinessScore, qualityScore };
}


// calculate final weighted score
export function calculateFinalScore(scores) {
  return (
    scores.kpiScore * 0.4 +
    scores.timelinessScore * 0.3 +
    scores.qualityScore * 0.3
  );
}


// rank users based on final score
export function rankUsers(users, kpis, submissions) {
  return (users || [])
    .filter(u => u.role === "staff")
    .map(user => {
      const scores = calculateUserPerformance(user.id, kpis, submissions);

      return {
        ...user,
        kpiScore: Math.round(scores.kpiScore),
        timelinessScore: Math.round(scores.timelinessScore),
        qualityScore: Math.round(scores.qualityScore),
        finalScore: Math.round(calculateFinalScore(scores))
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}