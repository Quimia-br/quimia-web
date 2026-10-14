import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import NotFound from "./NotFound";
import GenericError from "./GenericError";

function RouteErrorBoundary() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  if (isNotFound) {
    return <NotFound />;
  }

  return <GenericError />;
}

export default RouteErrorBoundary;
