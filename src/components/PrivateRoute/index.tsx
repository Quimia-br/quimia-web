import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/hooks/use-user";
import { useLogout } from "@/hooks/use-logout";
import BasicButton from "@/components/BasicButton";
import Loading from "@/pages/Loading";
import RouteMain from "@/components/RouteMain";

export default function PrivateRoute() {
  const { canRefresh } = useAuth();
  const query = useUser();
  const logout = useLogout();
  const location = useLocation();
  const unauthenticated =
    !canRefresh || (isAxiosError(query.error) && query.error.response?.status === 401);
  if (unauthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (query.isPending)
    return (
      <RouteMain aria-busy="true">
        <Loading />
      </RouteMain>
    );
  if (query.isError) {
    const denied = isAxiosError(query.error) && query.error.response?.status === 403;
    return (
      <RouteMain className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
        <div role="alert" className="flex flex-col gap-3">
          <h1 className="text-3xl font-medium">
            {denied ? "Acesso não permitido" : "Não foi possível verificar sua sessão"}
          </h1>
          <p>
            {denied
              ? "Sua conta não tem acesso a este recurso."
              : "Verifique sua conexão e tente novamente."}
          </p>
        </div>
        <BasicButton onClick={() => void query.refetch()}>Tentar novamente</BasicButton>
        <BasicButton
          variant="secondary"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          Sair
        </BasicButton>
      </RouteMain>
    );
  }
  if (!query.data) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
