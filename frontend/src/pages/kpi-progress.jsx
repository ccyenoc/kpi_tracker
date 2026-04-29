import PageTitle from "../components/page_title"
import { useLocation } from "react-router-dom";
import ProgressInputKPITitle from "../components/progress_input_KPI_title";
import ProgressCategorySelection from "../components/progress_category_selection";
import ProgressKPIPrediction from "../components/progress_prediction";
import ProgressTargetKPISelection from "../components/progress_target_kpi";
import ProgressDeadline from "../components/progress_deadline";
import ProgressKPIAssignStaff from "../components/progress_kpi_assign_staff";
import ProgressKPIGraph from "../components/progress_kpi_graph";
import TopBreadcrumb from "../components/top_breadcrumb";

function KPIProgressPage() {
    {/*access data about the current page*/ }
    const location = useLocation();
    const state = location.state || {};

    return(
      <div
        className="d-flex"
        style={{
            flexDirection:"column",
            marginLeft:"150px",
            marginBottom:"20px",
        }}>

            <ManagerSidebar />
             <TopBreadcrumb
                 items={[
                     { label: "KPI Management", 
                        path: "/kpi-management" },
                     { label: "KPI Progress" }
                     ]}
            />

            {/*title*/}
            <PageTitle
                title="Track KPI Progress"
                subtitle="Track real time KPI progress and status prediction" />

            {/*show the kpi info */}
            {/*prediction and graph */}
            <div
                className="mx-3 mb-4 d-flex"
                style={{
                    padding: "24px",
                    flexDirection: "row",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}>

                <ProgressKPIPrediction />
                <ProgressKPIGraph
                    data={[
                        { week: "Week 1", progress: 65, prediction: 70 },
                        { week: "Week 2", progress: 72, prediction: 75 },
                        { week: "Week 3", progress: 78, prediction: 80 },
                        { week: "Week 4", progress: 85, prediction: 88 },
                    ]} />

            </div>

            <div
                className="mx-3 mb-4 d-flex"
                style={{
                    padding: "24px",
                    flexDirection: "column",
                    borderRadius: "12px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}>
                {/*kpi title and category */}
                <div
                    className="d-flex"
                    style={{
                        flexDirection: "row",
                        gap: "400px",
                        marginTop: "20px",
                    }}>

                    <ProgressInputKPITitle title={state.title} />
                    <ProgressCategorySelection category={state.category} />

                </div>

                {/*kpi and deadline */}
                <div
                    className="d-flex"
                    style={{
                        flexDirection: "row",
                        marginTop: "20px",
                        gap: "420px",
                    }}>

                    <ProgressTargetKPISelection kpi={state.target} unit={state.unit} />
                    <ProgressDeadline date={state.deadline} />

                </div>

                {/*assigned*/}
                <div
                    className="d-flex"
                    style={{
                        flexDirection: "row",
                        marginTop: "40px",
                    }}>

                    {/*mock data*/}
                    <ProgressKPIAssignStaff
                        staffProgress={[
                            {
                                staffId: 1,
                                name: state.team,
                                email: "john.smith@company.com",
                                assignedKpi: state.target,
                                progress: 5000,
                                target: state.target,
                                evidenceCount: 2
                            }
                        ]}
                        unit="units" />

                </div>
            </div>


        </div>
    )
}

export default KPIProgressPage