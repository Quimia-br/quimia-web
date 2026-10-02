import { createBrowserRouter } from "react-router-dom";
import RouteErrorBoundary from "@/pages/RouteErrorBoundary";
import Products from "@/pages/Products";
import Graphs from "@/pages/Graphs";
import Profile from "@/pages/Profile";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import QuimiaSidebarProvider from "@/components/QuimiaSidebarProvider";
import ProtectedRoute from "@/lib/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: "/signup",
    Component: Signup,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    Component: ProtectedRoute,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        Component: QuimiaSidebarProvider,
        children: [
          {
            path: "/",
            Component: Home,
            ErrorBoundary: RouteErrorBoundary,
          },
          {
            path: "/products",
            Component: Products,
            ErrorBoundary: RouteErrorBoundary,
          },
          {
            path: "/graphs",
            Component: Graphs,
            ErrorBoundary: RouteErrorBoundary,
          },
          {
            path: "/profile",
            Component: Profile,
            ErrorBoundary: RouteErrorBoundary,
          },
        ],
      },
    ],
  },
]);

export default router;
