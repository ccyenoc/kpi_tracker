import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { routes } from "./Routes.jsx";
import { useAuth } from "./Auth.jsx";
import { pathway } from "./Pathway";
import Login from "./pages/Login";
import RegisterAcc from "./pages/RegisterAcc";

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<Login />} />
        <Route path="/signup" element={<RegisterAcc />} />

        {/* ROOT REDIRECT */}
        <Route
          path="/"
          element={
            user
              ? (
                  <Navigate
                    to={
                      user.role === "manager"
                        ? pathway.ManagerDashboard
                        : pathway.StaffDashboard
                    }
                  />
                )
              : <Navigate to={pathway.Login} />
          }
        />

        {/* PROTECTED ROUTES */}
        <Route element={<Layout />}>
          {user &&
            routes(user.role).map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.element}
              />
            ))
          }
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;