import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getDashboardPathForRole, getStoredRole, isAuthenticated } from "../auth/auth.js";

export default function ProtectedRoute({ allowedRole }) {
  const location = useLocation();
  const currentRole = getStoredRole();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (currentRole !== allowedRole) {
    return <Navigate to={getDashboardPathForRole(currentRole)} replace />;
  }

  return <Outlet />;
}
