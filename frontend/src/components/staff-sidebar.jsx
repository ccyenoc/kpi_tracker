import { NavLink } from 'react-router-dom';

function Sidebar() {
 
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
 
         <ul 
           className="nav flex-column mb-auto text-start list-unstyled"
           style = {{fontSize: "15px"}}>
             <li className="nav-item">
                 <NavLink to="/" className={({ isActive }) =>
     "nav-link text-white " + (isActive ? "active-link" : "")
   }>Dashboard</NavLink>
             </li>
 
             <li className="nav-item">
                 <NavLink to="/staff-kpi-progress-update" className={({ isActive }) =>
     "nav-link text-white " + (isActive ? "active-link" : "")
   }>My KPIs</NavLink>
             </li>
            </ul>
 
          
 
         </div>
     )
}

export default Sidebar