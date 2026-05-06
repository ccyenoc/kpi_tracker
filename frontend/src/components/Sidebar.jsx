import {useEffect , useState} from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Target, SquareCheckBig, TrendingUp } from 'lucide-react';
import { pathway } from "../Pathway";
import { useAuth } from "../Auth.jsx";

//in react a component is a function that return a piece of UI 
function Sidebar(){
    // const [user, setUser] = useState(null);
    const { user } = useAuth();

    // useEffect(()=>{
    //     fetch("http://localhost:8000/api/user")
    //         .then(res => res.json())
    //         .then(data => setUser(data))
    //         .catch(err => console.error(err))
    // }, []);

    const roleDisplay = {
     manager: "Manager",
     staff: "Staff",
    };

      const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch('/api/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
            // Clear localStorage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect even if API call fails
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/signin';
        }
    };

    return(
        // bootstap classes : 
        // 1. d-flex : use flexbox layout
        // 2. flex-column : stack items vertically
        // 3. p-3 : padding of 3 units
        // 4. text-white : white color
        <div className="d-flex flex-column p-3 text-white text-start flex-shrink-0"
            style={{
                width :"250px",
                height: "100vh",
                backgroundColor: '#1E40AF',
                position:"sticky",
                left : 0 ,
                top : 0,
                borderRight: "none",
            }}>

            <ul
                className="nav flex-column mb-auto text-start list-unstyled"
                style={{ fontSize: "15px" }}>
                
                {user?.role === "manager"&& (
                    <>
                        <li className="nav-item">
                            <NavLink to={pathway.ManagerDashboard} 
                            style={({ isActive }) =>
    isActive
      ? {
          background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
          color: "white",
          borderRadius: "12px",
          fontWeight: 500,
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
        }
      : {
          color: "white"
        }
  }
  className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none"

                            ><LayoutDashboard size={20} />Dashboard</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to={pathway.KpiManagement} style={({ isActive }) =>
    isActive
      ? {
          background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
          color: "white",
          borderRadius: "12px",
          fontWeight: 500,
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
        }
      : {
          color: "white"
        }
  }
  className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none"
><Target size={20} />KPI Management</NavLink>
                        </li>

                        <li>
                            <NavLink to={pathway.VerifyKPIDashboard} style={({ isActive }) =>
    isActive
      ? {
          background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
          color: "white",
          borderRadius: "12px",
          fontWeight: 500,
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
        }
      : {
          color: "white"
        }
  }
  className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none"
><SquareCheckBig size={20} />Verify KPI</NavLink>
                        </li>    
                    </>   
                )}
                {user?.role === "staff" && (
                    <>
                        <li className="nav-item">
                            <NavLink to={pathway.StaffDashboard} style={({ isActive }) =>
    isActive
      ? {
          background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
          color: "white",
          borderRadius: "12px",
          fontWeight: 500,
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
        }
      : {
          color: "white"
        }
  }
  className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none"
><LayoutDashboard size={20} />Dashboard</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to={pathway.StaffKPIUpdate} style={({ isActive }) =>
    isActive
      ? {
          background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
          color: "white",
          borderRadius: "12px",
          fontWeight: 500,
          boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
        }
      : {
          color: "white"
        }
  }
  className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none"
><TrendingUp size={20} />My KPIs</NavLink>
                        </li>
                    </>
                )}
                
            </ul>

            <div
              style ={{
                display:"flex",
                flexDirection:"column",
                justifyContent:"flex-content",
                gap:"10px",
              }}>
            <a href={pathway.ProfilePage} className="mt-auto pt-4 border-top text-decoration-none text-white">
                <div className="d-flex align-items-center gap-2 px-2 py-2 rounded">
                <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style={{ width: 32, height: 32, backgroundColor: '#155DFC', fontSize: '12px' }}>
                    {user ? user.name.charAt(0) : "JS"}
                </div>
                <div>
                    <div className="small fw-medium">{user ? user.name : "Jane Staff"}</div>
                    <div className="text-white-50" style={{ fontSize: '10px' }}>{user ? user.role : "Staff"}</div>
                    
                </div>
                </div>
            </a>

                <button
                    className="btn"
                    onClick={handleLogout}
                    style={{ 
                        fontSize: "14px",
                        backgroundColor:"#ed2c2c",
                        color:"#ffffff",
                     }}
                >
                  Logout
                </button>

            </div>

        </div>
    )
}

export default Sidebar;