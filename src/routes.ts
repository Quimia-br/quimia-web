import { createBrowserRouter, type RouteObject } from "react-router-dom";
import QueryStateLayout from "@/lib/QueryStateLayout";
import RouteErrorBoundary from "@/pages/RouteErrorBoundary";
import ResetPassword from "@/pages/ResetPassword";
import Products from "@/pages/Products";
import Profile from "@/pages/Profile";
import Signup from "@/pages/Signup";
import { SignupSuccess, SignupError } from "@/pages/SignupFeedback";
import PasswordResetSuccess from "@/pages/PasswordResetSuccess";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import ProtectedRoute from "@/lib/ProtectedRoute";
import Sidebar from "@/pages/Sidebar";
import GraphsRoute from "@/pages/GraphsRoute";

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
    path: "/recover-password",
    Component: ResetPassword,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: "/recuperar-senha",
    Component: ResetPassword,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: "/reset-password/success",
    Component: PasswordResetSuccess,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: "/signup/success",
    Component: SignupSuccess,
    ErrorBoundary: RouteErrorBoundary,
  },
  {
    path: "/signup/error",
    Component: SignupError,
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
            Component: GraphsRoute,
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

const router = createBrowserRouter([
  { Component: QueryStateLayout, ErrorBoundary: RouteErrorBoundary, children: routes },
]);

export default router;
