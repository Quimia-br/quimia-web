import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/hooks/use-user";
import { useAuthStore } from "@/lib/auth-token";
import axios from "axios";
import GenericError from "@/pages/GenericError";
import Loading from "@/pages/Loading";

function ProtectedRoute() {
  const { data: user, isLoading, isError, error } = useUser();
  const canRefresh = useAuthStore((state) => state.canRefresh);
  const location = useLocation();

  if (
    !canRefresh ||
    (axios.isAxiosError(error) && error.response?.status === 401)
  ) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <GenericError />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
