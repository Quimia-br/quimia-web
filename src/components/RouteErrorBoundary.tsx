import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { Button } from "./ui/button";

function RouteErrorBoundary() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <section
        aria-labelledby="route-error-title"
        className="w-full max-w-lg rounded-2xl bg-surface-base p-8 text-center shadow-sm"
        role="alert"
      >
        <h1
          className="text-subtitle font-medium text-text-primary"
          id="route-error-title"
        >
          {isNotFound ? "Página não encontrada" : "Algo deu errado"}
        </h1>
        <p className="mt-2 text-text-secondary">
          {isNotFound
            ? "Não encontramos a página que você tentou acessar."
            : "Não foi possível carregar esta página. Tente novamente."}
        </p>
        <Button
          className="mt-6"
          onClick={() => window.location.reload()}
          type="button"
        >
          Tentar novamente
        </Button>
      </section>
    </main>
  );
}

export default RouteErrorBoundary;
