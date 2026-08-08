import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PageLoader from "./Loader/PageLoader";
export default function ProtectedRoute({ roles }) {
  const { user, checking } = useAuth();
  if (checking) return <PageLoader />;
  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
