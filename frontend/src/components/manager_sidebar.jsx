import {useEffect , useState} from "react";
import {Link} from "react-router-dom";

//in react a component is a function that return a piece of UI 
function ManagerSidebar(){
    const [user, setUser] = useState(null);

    useEffect(()=>{
        fetch("http://localhost:8000/api/user")
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(err => console.error(err))
    }, []);

    return(
        // bootstap classes : 
        // 1. d-flex : use flexbox layout
        // 2. flex-column : stack items vertically
        // 3. p-3 : padding of 3 units
        // 4. text-white : white color
        <div className="d-flex flex-column p-3 text-white text-start"
            style={{
                width :"250px",
                height: "100vh",
                background : "linear-gradient(180deg, #2b4cb3,#134a8a)",
                position:"fixed",
                left : 0 ,
                top : 0,
                borderRight: "none",
            }}>

        <ul className="nav flex-column mb-auto text-start list-unstyled">
            <li className="nav-item">
                <Link to="/" className="nav-link text-white">Dashboard</Link>
            </li>

            <li className="nav-item">
                <Link to="/kpi-management" className="nav-link text-white">KPI Management</Link>
            </li>

            <li>
                <Link to="/verify-kpi" className="nav-link text-white">Verify KPI</Link>
            </li>
        </ul>

        <div className="mt-auto d-flex align-items-center">
            <div className="rounded-circle bg-primary d-flex justify-content-center align-items-center me-2"
                style={{ width: "40px", height: "40px" }} >
               {user ? user.name.charAt(0) : ""}
             </div>
        </div>

        </div>
    )
}

export default ManagerSidebar;