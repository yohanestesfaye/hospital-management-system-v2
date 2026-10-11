import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Check role-based permission (admin has universal access)
  if (
    allowedRoles &&
    user?.role !== "admin" &&
    !allowedRoles.includes(user?.role)
  ) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;