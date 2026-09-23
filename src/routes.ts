import { createBrowserRouter } from "react-router-dom";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import Home from "./pages/Home";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
    ErrorBoundary: RouteErrorBoundary,
  },
]);

export default router
