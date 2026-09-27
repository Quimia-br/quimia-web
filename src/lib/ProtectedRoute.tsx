import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useUser } from "@/hooks/use-user";
import MotionLoader from "@/components/smoothui/motion-loader";

function ProtectedRoute() {
  const { data: user, isLoading, isError } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="flex items-center justify-center h-screen">
        <MotionLoader
          label="Loading"
          color="var(--color-accent)"
          variant="morph-ring"
          size={96}
        />
      </main>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
