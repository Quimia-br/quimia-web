import { createBrowserRouter } from "react-router-dom";
import RouteErrorBoundary from "@/pages/RouteErrorBoundary";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ProtectedRoute from "@/lib/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/signup",
    Component: Signup,
  },
  {
    Component: ProtectedRoute,
    children: [
      {
        path: "/",
        Component: Home,
        ErrorBoundary: RouteErrorBoundary,
      },
    ],
  },
]);

export default router;
