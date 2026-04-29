# Firebase Firestore Schema Documentation

This document defines the complete Firestore database structure for the KPI Tracker application.

## Collection Overview

```
Root Collections:
├── users/
├── teams/
├── categories/
├── kpis/ (with subcollections)
├── submissions/
├── kpiProgress/
├── staffPerformance/
├── kpiPredictions/
├── dashboardMetrics/
└── auditLogs/
```

---

## 1. **users** Collection
**Path:** `/users/{userId}`

Stores all user information (staff and managers).

### Document Structure
```javascript
{
  docId: "user_101",           // Firestore document ID
  id: 101,                     // Custom numeric ID
  name: "John Tan",
  email: "johntan@gmail.com",
  role: "staff",          
  avatar: "https://i.pravatar.cc/60?img=1",
  assignedKpis: ["kpi_1", "kpi_2"],  // Array of KPI IDs
  teamIds: ["team_1"],         // References to teams collection
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Indexes
- Email (for authentication lookup)
- Role (for filtering managers/staff)
- Active status


## 3. **categories** Collection
**Path:** `/categories/{categoryId}`

KPI categories for organization.

### Document Structure
```javascript
{
  docId: "cat_1",
  id: 1,
  name: "Sales Performance",
  color: "#3b82f6",
  description: "Sales-related KPIs",
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 4. **kpis** Collection
**Path:** `/kpis/{kpiId}`

Main KPI documents with optional subcollections.

### Document Structure
```javascript
{
  docId: "kpi_1",
  id: 1,
  title: "Sales Growth",
  description: "Increase monthly sales by 10%",
  target_kpi: 100,              // Target value
  current_progress: 67,         // Current progress
  unit: "%",
  category: "Sales",
  categoryId: "cat_1",          // Reference to categories
  deadline: Timestamp,
  status: "in_progress",        // in_progress, completed, overdue, on_hold
  assignedUserIds: ["user_101", "user_102"],
  createdBy: "user_manager",    // Reference to creator
  kpiProgress: [
    {
      userId: "user_101",
      target: 70,
      progress: 0,
      lastUpdated: Timestamp
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Subcollections

#### 4.1 `kpis/{kpiId}/progress`
Tracks progress over time (weekly/monthly snapshots).

```javascript
{
  docId: "prog_w1",
  week: "Week 1",
  weekNumber: 1,
  kpi: 65,
  progress: 60,
  prediction: 68,
  timestamp: Timestamp
}
```

#### 4.2 `kpis/{kpiId}/submissions`
Evidence submissions for approval.

```javascript
{
  docId: "sub_1",
  submittedBy: "user_101",
  fileName: "sales_report.pdf",
  fileUrl: "gs://bucket/path/file.pdf",
  fileType: "pdf",
  status: "pending",            // pending, approved, rejected
  approvedBy: "user_manager",
  comments: "Approved with notes",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 4.3 `kpis/{kpiId}/comments`
Discussions on KPI.

```javascript
{
  docId: "comment_1",
  userId: "user_101",
  text: "Great progress this week!",
  createdAt: Timestamp
}
```

---

## 5. **submissions** Collection (Alternative Path)
**Path:** `/submissions/{submissionId}`

Can be used as root collection or subcollection. Contains evidence submissions.

### Document Structure
```javascript
{
  docId: "sub_1",
  id: 1,
  kpiId: "kpi_1",               // Reference to KPI
  submittedBy: "user_101",      // Reference to user
  fileName: "sales_report_march.pdf",
  fileUrl: "/files/sales_report_march.pdf",
  fileType: "pdf",
  fileSize: 2048,               // in KB
  approved: true,
  approvedBy: "user_manager",
  submittedDate: Timestamp,
  approvedDate: Timestamp,
  comments: "Great sales report",
  status: "approved",           // pending, approved, rejected
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Indexes
- kpiId (for fetching submissions by KPI)
- submittedBy (for user's submissions)
- status (for filtering approvals)

---

## 6. **kpiProgress** Collection
**Path:** `/kpiProgress/{progressId}`

Aggregated progress tracking (can also be subcollection).

### Document Structure
```javascript
{
  docId: "prog_w1",
  kpiId: "kpi_3",
  week: "Week 1",
  weekNumber: 1,
  kpi: 65,
  progress: 60,
  prediction: 68,
  timestamp: Timestamp
}
```

### Indexes
- kpiId (for progress by KPI)
- timestamp (for time-range queries)

---

## 7. **staffPerformance** Collection
**Path:** `/staffPerformance/{staffId}`

Current performance metrics for each staff member.

### Document Structure
```javascript
{
  docId: "perf_101",
  staffId: "user_101",          // Reference to user
  rank: 1,
  name: "John Doe",
  score: 87,
  kpiCompletion: 40,
  completedKpis: 2,
  pendingKpis: 3,
  performanceTrend: "up",       // up, down, stable
  lastUpdated: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Indexes
- score (for ranking queries)
- performanceTrend (for filtering)

---

## 8. **kpiPredictions** Collection
**Path:** `/kpiPredictions/{predictionId}`

AI-generated predictions for KPIs.

### Document Structure
```javascript
{
  docId: "pred_1",
  kpiId: "kpi_3",
  overall: "On Track ✅",
  warnings: ["Minor dip last week"],
  confidenceScore: 92,
  projectedOutcome: "Will reach 100% by deadline",
  riskLevel: "low",             // low, medium, high, critical
  predictedEndValue: 100,
  updatedAt: Timestamp,
  createdAt: Timestamp
}
```

### Indexes
- kpiId (for KPI lookups)
- riskLevel (for dashboard filtering)

---

## 9. **dashboardMetrics** Collection
**Path:** `/dashboardMetrics/{docId}`

Aggregated statistics (usually one document per period).

### Document Structure
```javascript
{
  docId: "current",             // or timestamp: "2026-04-28"
  period: "2026-04-28",
  totalKpis: 12,
  activeKpis: 8,
  completedKpis: 3,
  overdueKpis: 1,
  atRiskKpis: 2,
  onTrackKpis: 6,
  totalTeamMembers: 15,
  teamOnTrack: 12,
  teamAtRisk: 2,
  totalSubmissions: 24,
  approvedSubmissions: 12,
  rejectedSubmissions: 4,
  completionRate: 68,
  averageTeamScore: 82.5,
  updatedAt: Timestamp,
  updatedBy: "user_manager"
}
```

---

## 10. **monthlyPerformance** Collection
**Path:** `/monthlyPerformance/{monthId}`

Monthly aggregated performance data.

### Document Structure
```javascript
{
  docId: "month_04",
  kpiId: "kpi_3",
  month: "April",
  monthNumber: 4,
  value: 85,
  prediction: 88,
  timestamp: Timestamp
}
```

---

## 11. **auditLogs** Collection (Optional)
**Path:** `/auditLogs/{logId}`

Track all significant actions for compliance.

### Document Structure
```javascript
{
  docId: "log_1",
  userId: "user_manager",
  action: "KPI_CREATED",        // KPI_CREATED, KPI_UPDATED, SUBMISSION_APPROVED, etc.
  entityType: "kpi",
  entityId: "kpi_1",
  changes: {
    before: {},
    after: {}
  },
  timestamp: Timestamp
}
```

---

## Relationships & References

```
users (1) ──→ (N) teams
        └─→ (N) kpis (assigned)
        └─→ (N) staffPerformance
        └─→ (N) submissions
        └─→ (N) comments

teams (1) ──→ (N) users

categories (1) ──→ (N) kpis

kpis (1) ──→ (N) progress (subcollection)
      ├─→ (N) submissions (subcollection)
      ├─→ (N) comments (subcollection)
      ├─→ (N) predictions
      └─→ (N) users (assigned)

submissions (N) ──→ (1) kpis
            └─→ (1) users
```

---

## Security Rules Template

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId || hasRole('admin');
    }
    
    // KPIs - managers can create/edit, staff can view assigned
    match /kpis/{kpiId} {
      allow read: if hasRole('manager') || hasRole('admin');
      allow create, update: if hasRole('manager') || hasRole('admin');
      
      match /progress/{progressId} {
        allow read: if true;
      }
      
      match /submissions/{submissionId} {
        allow read: if hasRole('manager');
        allow create: if request.auth.uid == resource.data.submittedBy;
      }
    }
    
    // Submissions - staff can create, managers can approve
    match /submissions/{submissionId} {
      allow create: if request.auth.uid != null;
      allow read, update: if hasRole('manager') || hasRole('admin');
    }
    
    // Helper functions
    function hasRole(role) {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
    }
  }
}
```

---

## Data Import Steps

1. Create collections in order: `users` → `teams` → `categories` → `kpis`
2. Use data from `userData.js`, `staffAssignmentData.js`, etc.
3. Create subcollections for progress, submissions, comments
4. Set up indexes for frequently queried fields
5. Configure security rules
6. Test queries before production

---

## Query Examples

```javascript
// Get all active KPIs
db.collection('kpis').where('status', '==', 'in_progress').get();

// Get KPIs assigned to a user
db.collection('kpis').where('assignedUserIds', 'array-contains', 'user_101').get();

// Get staff ranking
db.collection('staffPerformance').orderBy('score', 'desc').limit(10).get();

// Get KPI progress over time
db.collection('kpis').doc('kpi_3').collection('progress').orderBy('timestamp').get();

// Get pending submissions
db.collection('submissions').where('status', '==', 'pending').get();
```

---

## Estimated Data Size

- Users: ~50-200 documents
- Teams: ~5-20 documents
- Categories: ~8-15 documents
- KPIs: ~20-100 documents
- Submissions: ~100-500 documents (grows over time)
- Progress records: ~200-1000+ documents
- Predictions: 1 per active KPI
- Dashboard Metrics: 1-30 documents

---

## Next Steps

1. Create Firebase project
2. Initialize Firestore database
3. Import data from mock files
4. Set up authentication
5. Configure security rules
6. Create indexes
7. Test all queries
8. Deploy to production
