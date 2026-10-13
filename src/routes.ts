import { createBrowserRouter, type RouteObject } from "react-router-dom";
import QueryStateLayout from "@/lib/QueryStateLayout";
import RouteErrorBoundary from "@/pages/RouteErrorBoundary";
import ResetPassword from "@/pages/ResetPassword";
import Products from "@/pages/Products";
import Profile from "@/pages/Profile";
import Graphs from "@/pages/Graphs";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import ProtectedRoute from "@/lib/ProtectedRoute";
import Sidebar from "@/pages/Sidebar";

const routes: RouteObject[] = [
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
    path: "/reset-password",
    Component: ResetPassword,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    Component: ProtectedRoute,
    ErrorBoundary: RouteErrorBoundary,
    children: [
      {
        Component: Sidebar,
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
];

const router = createBrowserRouter([{ Component: QueryStateLayout, ErrorBoundary: RouteErrorBoundary, children: routes }]);

export default router;
