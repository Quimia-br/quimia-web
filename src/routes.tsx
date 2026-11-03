import { lazy } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import QueryStateLayout from "@/lib/QueryStateLayout";
import PageBoundary from "@/components/PageBoundary";
import PrivateRoute from "@/components/PrivateRoute";
import Sidebar from "@/pages/Sidebar";

const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const PasswordResetSuccess = lazy(() => import("@/pages/PasswordResetSuccess"));
const SignupSuccess = lazy(() => import("@/pages/SignupFeedback").then(module => ({ default: module.SignupSuccess })));
const SignupError = lazy(() => import("@/pages/SignupFeedback").then(module => ({ default: module.SignupError })));
const Home = lazy(() => import("@/pages/Home"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Graphs = lazy(() => import("@/pages/Graphs"));
const Profile = lazy(() => import("@/pages/Profile"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const ErrorPage = lazy(() => import("@/pages/RouteErrorBoundary"));

function RouteErrorBoundary() { return <PageBoundary><ErrorPage /></PageBoundary>; }

const routes: RouteObject[] = [
  { path: "/login", element: <PageBoundary><Login /></PageBoundary> },
  { path: "/signup", element: <PageBoundary><Signup /></PageBoundary> },
  ...["/reset-password", "/recover-password", "/recuperar-senha"].map(path => ({ path, element: <PageBoundary><ResetPassword /></PageBoundary> })),
  { path: "/reset-password/success", element: <PageBoundary><PasswordResetSuccess /></PageBoundary> },
  { path: "/signup/success", element: <PageBoundary><SignupSuccess /></PageBoundary> },
  { path: "/signup/error", element: <PageBoundary><SignupError /></PageBoundary> },
  {
    Component: PrivateRoute,
    children: [{ Component: Sidebar, children: [
      { path: "/", element: <PageBoundary><Home /></PageBoundary> },
      { path: "/products", element: <PageBoundary><Products /></PageBoundary> },
      { path: "/products/:productId", element: <PageBoundary><ProductDetail /></PageBoundary> },
      { path: "/graphs", element: <PageBoundary><Graphs /></PageBoundary> },
      { path: "/profile", element: <PageBoundary><Profile /></PageBoundary> },
    ] }],
  },
  { path: "*", element: <PageBoundary><NotFound /></PageBoundary> },
];

const router = createBrowserRouter([{ Component: QueryStateLayout, ErrorBoundary: RouteErrorBoundary, children: routes }]);
export default router;
