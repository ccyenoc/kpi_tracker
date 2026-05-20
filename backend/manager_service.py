from firebase_admin import firestore
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from pydantic import BaseModel


def get_db():
    return firestore.client()


class KPIStaffAssignment(BaseModel):
    staffId: str
    staffName: str
    staffEmail: str
    targetValue: float


class AssignKPIRequest(BaseModel):
    kpiId: str
    assignments: List[KPIStaffAssignment]


class VerifySubmissionRequest(BaseModel):
    submissionId: str
    kpiId: str
    status: str
    comments: Optional[str] = None


class KPIAssignmentService:
    @staticmethod
    def assign_kpi_to_staff(kpi_id: str, assignments: List[KPIStaffAssignment], manager_id: str) -> Dict:
        try:
            db = get_db()
            kpi_ref = db.collection("kpiData").document(kpi_id)
            kpi_doc = kpi_ref.get()

            if not kpi_doc.exists:
                return {"success": False, "message": "KPI not found"}

            kpi_data = kpi_doc.to_dict()

            assigned_users = kpi_data.get("assignedUserIds", [])
            kpi_assignments = kpi_data.get("kpiAssignments", [])

            for assignment in assignments:
                if assignment.staffId not in assigned_users:
                    assigned_users.append(assignment.staffId)

                existing_assignment = next(
                    (a for a in kpi_assignments if a.get("userId") == assignment.staffId),
                    None
                )

                if existing_assignment:
                    existing_assignment["target"] = assignment.targetValue
                else:
                    kpi_assignments.append({
                        "userId": assignment.staffId,
                        "target": assignment.targetValue,
                        "current": 0,
                        "assignedBy": manager_id,
                        "assignedAt": datetime.now()
                    })

            kpi_ref.update({
                "assignedUserIds": assigned_users,
                "kpiAssignments": kpi_assignments,
                "updatedAt": datetime.now()
            })

            user_ref = db.collection("userData").document(assignment.staffId)
            user_data = user_ref.get().to_dict() or {}
            assigned_kpis = user_data.get("assignedKpis", [])

            if kpi_id not in assigned_kpis:
                assigned_kpis.append(kpi_id)
                user_ref.update({"assignedKpis": assigned_kpis})

            return {
                "success": True,
                "message": "KPI assigned to staff successfully",
                "kpiId": kpi_id,
                "assignedCount": len(assignments)
            }

        except Exception as e:
            return {"success": False, "message": str(e)}

    @staticmethod
    def get_kpi_assignments(kpi_id: str) -> Dict:
        try:
            db = get_db()
            kpi_ref = db.collection("kpiData").document(kpi_id)
            kpi_doc = kpi_ref.get()

            if not kpi_doc.exists:
                return {"success": False, "message": "KPI not found"}

            kpi_data = kpi_doc.to_dict()
            kpi_assignments = kpi_data.get("kpiAssignments", [])

            assignments = []
            for assignment in kpi_assignments:
                user_id = assignment.get("userId")
                user_doc = db.collection("userData").document(user_id).get()
                user_data = user_doc.to_dict() or {}

                assignments.append({
                    "staffId": user_id,
                    "staffName": user_data.get("name", "Unknown"),
                    "staffEmail": user_data.get("email", "Unknown"),
                    "targetValue": assignment.get("target", 0),
                    "progress": assignment.get("current", 0),
                    "assignedAt": assignment.get("assignedAt")
                })

            return {
                "success": True,
                "kpiId": kpi_id,
                "assignments": assignments,
                "totalAssigned": len(assignments)
            }

        except Exception as e:
            return {"success": False, "message": str(e)}


class SubmissionVerificationService:
    @staticmethod
    def get_all_submissions(kpi_id: Optional[str] = None) -> Dict:
        try:
            db = get_db()
            query = db.collection("kpiSubmissions")

            if kpi_id:
                query = query.where("kpiId", "==", kpi_id)

            docs = query.stream()
            submissions = []

            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                submissions.append(data)

            return {
                "success": True,
                "submissions": submissions,
                "count": len(submissions)
            }

        except Exception as e:
            return {"success": False, "message": str(e)}

    @staticmethod
    def get_pending_submissions(kpi_id: Optional[str] = None) -> Dict:
        try:
            db = get_db()
            query = db.collection("kpiSubmissions").where("status", "==", "pending")

            if kpi_id:
                query = query.where("kpiId", "==", kpi_id)

            docs = query.stream()
            submissions = []

            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                submissions.append(data)

            return {
                "success": True,
                "submissions": submissions,
                "count": len(submissions)
            }

        except Exception as e:
            return {"success": False, "message": str(e)}

    @staticmethod
    def verify_submission(submission_id: str, kpi_id: str, status: str, comments: str, manager_id: str) -> Dict:
        try:
            if status not in ["approved", "rejected"]:
                return {"success": False, "message": "Invalid status. Use 'approved' or 'rejected'"}

            db = get_db()
            submission_ref = db.collection("kpiSubmissions").document(submission_id)
            submission_doc = submission_ref.get()

            if not submission_doc.exists:
                return {"success": False, "message": "Submission not found"}

            submission_data = submission_doc.to_dict()
            submitted_by = submission_data.get("submittedBy")
            submission_current = submission_data.get("current", 0)

            # Update submission status
            submission_ref.update({
                "status": status,
                "approvedBy": manager_id,
                "comments": comments,
                "verifiedAt": datetime.now().isoformat()
            })

            # If approved, update the KPI assignment with submission data
            if status == "approved":
                kpi_ref = db.collection("kpiData").document(kpi_id)
                kpi_doc = kpi_ref.get()

                if kpi_doc.exists:
                    kpi_data = kpi_doc.to_dict() or {}
                    kpi_assignments = kpi_data.get("kpiAssignments", [])

                    # Update assignment for the staff member who submitted
                    updated = False
                    for assignment in kpi_assignments:
                        if assignment.get("userId") == submitted_by:
                            assignment["current"] = submission_current
                            assignment["lastUpdated"] = datetime.now().isoformat()
                            updated = True
                            break
                    
                    # Check if all assigned staff have approved submissions
                    all_submissions = list(db.collection("kpiSubmissions")
                        .where("kpiId", "==", kpi_id)
                        .stream())
                    assigned_staff = set(a.get("userId") for a in kpi_assignments)
                    approved_staff = set()
                    
                    for sub_doc in all_submissions:
                        sub_data = sub_doc.to_dict()
                        sub_status = sub_data.get("status")
                        sub_submitted_by = sub_data.get("submittedBy")

                        if sub_doc.id == submission_id or sub_status == "approved":
                            approved_staff.add(sub_submitted_by)

                    # Mark KPI as completed if all assigned staff have approved
                    all_approved = assigned_staff.issubset(approved_staff) if assigned_staff else False
                    new_status = "completed" if all_approved else "active"
                    
                    kpi_ref.update({
                        "kpiAssignments": kpi_assignments,
                        "status": new_status,
                        "updatedAt": datetime.now().isoformat()
                    })

            return {
                "success": True,
                "message": f"Submission {status} successfully",
                "submissionId": submission_id,
                "status": status
            }

        except Exception as e:
            return {"success": False, "message": str(e)}


class KPIReportService:
    @staticmethod
    def generate_report(kpi_id: str) -> Dict:
        try:
            db = get_db()
            kpi_ref = db.collection("kpiData").document(kpi_id)
            kpi_doc = kpi_ref.get()

            if not kpi_doc.exists:
                return {"success": False, "message": "KPI not found"}

            kpi_data = kpi_doc.to_dict()
            kpi_assignments = kpi_data.get("kpiAssignments", [])

            staff_performance = []
            for assignment in kpi_assignments:
                user_id = assignment.get("userId")
                user_doc = db.collection("userData").document(user_id).get()
                user_data = user_doc.to_dict() or {}

                target = assignment.get("target", 1)
                current = assignment.get("current", 0)
                achievement_rate = (current / target * 100) if target > 0 else 0

                staff_performance.append({
                    "staffId": user_id,
                    "staffName": user_data.get("name"),
                    "staffEmail": user_data.get("email"),
                    "target": target,
                    "progress": current,
                    "achievementRate": round(achievement_rate, 2),
                    "status": "On Track" if achievement_rate >= 80 else "At Risk" if achievement_rate >= 50 else "Off Track",
                    "assignedAt": assignment.get("assignedAt")
                })

            report_data = {
                "kpiId": kpi_id,
                "kpiTitle": kpi_data.get("title"),
                "category": kpi_data.get("category"),
                "deadline": kpi_data.get("deadline"),
                "overallProgress": kpi_data.get("current_progress", 0),
                "overallTarget": kpi_data.get("target_kpi", 0),
                "staffPerformance": staff_performance,
                "reportGeneratedAt": datetime.now(),
                "totalAssignedStaff": len(staff_performance)
            }

            return {
                "success": True,
                "report": report_data
            }

        except Exception as e:
            return {"success": False, "message": str(e)}

    @staticmethod
    def export_report_data(kpi_id: str) -> Dict:
        try:
            report_result = KPIReportService.generate_report(kpi_id)

            if not report_result["success"]:
                return report_result

            report = report_result["report"]

            csv_content = "Staff Name,Email,Target,Progress,Achievement Rate (%),Status,Last Updated\n"

            for staff in report["staffPerformance"]:
                csv_content += f"{staff['staffName']},{staff['staffEmail']},{staff['target']},{staff['progress']},{staff['achievementRate']},{staff['status']},{staff['lastUpdated']}\n"

            return {
                "success": True,
                "csvContent": csv_content,
                "fileName": f"KPI_Report_{kpi_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            }

        except Exception as e:
            return {"success": False, "message": str(e)}


class KPIPredictionService:
    @staticmethod
    def predict_kpi_outcome(kpi_id: str) -> Dict:
        try:
            db = get_db()
            kpi_ref = db.collection("kpiData").document(kpi_id)
            kpi_doc = kpi_ref.get()

            if not kpi_doc.exists:
                return {"success": False, "message": "KPI not found"}

            kpi_data = kpi_doc.to_dict()
            deadline = kpi_data.get("deadline")
            kpi_assignments = kpi_data.get("kpiAssignments", [])

            now = datetime.now()
            if isinstance(deadline, str):
                deadline = datetime.fromisoformat(deadline)
            elif hasattr(deadline, 'timestamp'):
                deadline = datetime.fromtimestamp(deadline.timestamp())

            days_remaining = (deadline - now).days if deadline > now else 0
            total_days = (deadline - datetime.fromisoformat(kpi_data.get("createdAt", now.isoformat()))).days if isinstance(kpi_data.get("createdAt"), str) else 30

            staff_predictions = []
            overall_prediction = 0

            for assignment in kpi_assignments:
                current_progress = assignment.get("current", 0)
                target = assignment.get("target", 1)
                current_rate = current_progress / target if target > 0 else 0

                if days_remaining > 0:
                    daily_rate = (current_rate / (total_days - days_remaining)) if (total_days - days_remaining) > 0 else 0
                    predicted_progress = min(100, (daily_rate * total_days) * 100)
                else:
                    predicted_progress = min(100, current_rate * 100)

                user_id = assignment.get("userId")
                user_doc = db.collection("userData").document(user_id).get()
                user_data = user_doc.to_dict() or {}

                status = "On Track" if predicted_progress >= 80 else "At Risk" if predicted_progress >= 50 else "Off Track"

                staff_predictions.append({
                    "staffId": user_id,
                    "staffName": user_data.get("name"),
                    "currentProgress": round(current_rate * 100, 2),
                    "predictedProgress": round(predicted_progress, 2),
                    "predictedStatus": status,
                    "daysRemaining": max(0, days_remaining)
                })

                overall_prediction += predicted_progress

            average_prediction = (overall_prediction / len(staff_predictions)) if staff_predictions else 0

            return {
                "success": True,
                "kpiId": kpi_id,
                "kpiTitle": kpi_data.get("title"),
                "deadline": deadline.isoformat() if deadline else None,
                "daysRemaining": max(0, days_remaining),
                "overallPredictedProgress": round(average_prediction, 2),
                "staffPredictions": staff_predictions,
                "predictionGeneratedAt": datetime.now().isoformat()
            }

        except Exception as e:
            return {"success": False, "message": str(e)}


class ManagerDashboardService:
    @staticmethod
    def get_dashboard_stats() -> Dict:
        try:
            db = get_db()
            staff_stats = {}

            # Aggregate stats for each staff member across all their KPIs
            kpi_docs = db.collection("kpiData").stream()
            total_kpis = 0
            active_kpis = 0
            completed_kpis = 0
            
            for kpi_doc in kpi_docs:
                total_kpis += 1
                kpi_data = kpi_doc.to_dict() or {}
                kpi_status = kpi_data.get("status", "pending")
                
                if kpi_status in ["active", "in_progress"]:
                    active_kpis += 1
                elif kpi_status == "completed":
                    completed_kpis += 1
                
                # Process each staff assignment for this KPI
                kpi_assignments = kpi_data.get("kpiAssignments", [])
                for assignment in kpi_assignments:
                    staff_id = assignment.get("userId")
                    if not staff_id:
                        continue

                    # Initialize staff entry if not exists
                    if staff_id not in staff_stats:
                        user_doc = db.collection("userData").document(staff_id).get()
                        user_data = user_doc.to_dict() or {}
                        staff_stats[staff_id] = {
                            "staffId": staff_id,
                            "name": user_data.get("name", "Unknown"),
                            "department": user_data.get("department", "Unknown"),
                            "email": user_data.get("email", "Unknown"),
                            "totalTarget": 0,
                            "totalCurrent": 0,
                            "kpiCount": 0,
                            "achievementRate": 0
                        }

                    # Accumulate KPI metrics
                    target = assignment.get("target", 0)
                    current = assignment.get("current", 0)
                    staff_stats[staff_id]["totalTarget"] += target
                    staff_stats[staff_id]["totalCurrent"] += current
                    staff_stats[staff_id]["kpiCount"] += 1

            # Calculate achievement rates
            staff_rankings = []
            for staff_id, stats in staff_stats.items():
                if stats["totalTarget"] > 0:
                    stats["achievementRate"] = round((stats["totalCurrent"] / stats["totalTarget"]) * 100, 2)
                else:
                    stats["achievementRate"] = 0
                staff_rankings.append(stats)

            # Get top performers
            staff_rankings.sort(key=lambda x: x["achievementRate"], reverse=True)
            top_rankings = staff_rankings[:10]
            
            return {
                "success": True,
                "dashboardStats": {
                    "totalKPIs": total_kpis,
                    "activeKPIs": active_kpis,
                    "completedKPIs": completed_kpis,
                    "totalStaff": len(staff_stats)
                },
                "staffRankings": top_rankings,
                "generatedAt": datetime.now().isoformat()
            }
        
        except Exception as e:
            return {
                "success": False,
                "message": str(e),
                "dashboardStats": {},
                "staffRankings": []
            }


class KPIStatusService:
    @staticmethod
    def get_at_risk_kpis() -> Dict:
        try:
            db = get_db()
            at_risk_kpis = []
            
            kpi_docs = db.collection("kpiData").stream()
            for kpi_doc in kpi_docs:
                kpi_data = kpi_doc.to_dict() or {}
                
                # Skip if already completed
                if kpi_data.get("status") == "completed":
                    continue
                
                kpi_assignments = kpi_data.get("kpiAssignments", [])
                
                if not kpi_assignments:
                    continue
                
                # Calculate average achievement rate for this KPI
                total_target = 0
                total_current = 0
                for assignment in kpi_assignments:
                    total_target += assignment.get("target", 0)
                    total_current += assignment.get("current", 0)
                
                if total_target > 0:
                    achievement_rate = (total_current / total_target) * 100
                    # At risk: between 50-80%
                    if 50 <= achievement_rate < 80:
                        kpi_data["id"] = kpi_doc.id
                        kpi_data["achievementRate"] = round(achievement_rate, 2)
                        kpi_data["status"] = "at_risk"
                        at_risk_kpis.append(kpi_data)
            
            return {
                "success": True,
                "kpis": at_risk_kpis,
                "count": len(at_risk_kpis)
            }
        except Exception as e:
            return {"success": False, "message": str(e), "kpis": []}
    
    @staticmethod
    def get_underperform_kpis() -> Dict:
        try:
            db = get_db()
            underperform_kpis = []
            
            kpi_docs = db.collection("kpiData").stream()
            for kpi_doc in kpi_docs:
                kpi_data = kpi_doc.to_dict() or {}
                
                # Skip if already completed
                if kpi_data.get("status") == "completed":
                    continue
                
                kpi_assignments = kpi_data.get("kpiAssignments", [])
                
                if not kpi_assignments:
                    continue
                
                # Calculate average achievement rate for this KPI
                total_target = 0
                total_current = 0
                for assignment in kpi_assignments:
                    total_target += assignment.get("target", 0)
                    total_current += assignment.get("current", 0)
                
                if total_target > 0:
                    achievement_rate = (total_current / total_target) * 100
                    # Underperforming: below 50%
                    if achievement_rate < 50:
                        kpi_data["id"] = kpi_doc.id
                        kpi_data["achievementRate"] = round(achievement_rate, 2)
                        kpi_data["status"] = "underperformed"
                        underperform_kpis.append(kpi_data)
            
            return {
                "success": True,
                "kpis": underperform_kpis,
                "count": len(underperform_kpis)
            }
        except Exception as e:
            return {"success": False, "message": str(e), "kpis": []}
