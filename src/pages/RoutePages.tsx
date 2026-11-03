import { lazy } from "react";
import PageBoundary from "@/components/PageBoundary";

export const Login = lazy(() => import("@/pages/Login"));
export const Signup = lazy(() => import("@/pages/Signup"));
export const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
export const PasswordResetSuccess = lazy(() => import("@/pages/PasswordResetSuccess"));
export const SignupSuccess = lazy(() =>
  import("@/pages/SignupFeedback").then((module) => ({ default: module.SignupSuccess })),
);
export const SignupError = lazy(() =>
  import("@/pages/SignupFeedback").then((module) => ({ default: module.SignupError })),
);
export const Home = lazy(() => import("@/pages/Home"));
export const Products = lazy(() => import("@/pages/Products"));
export const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
export const Graphs = lazy(() => import("@/pages/Graphs"));
export const Profile = lazy(() => import("@/pages/Profile"));
export const NotFound = lazy(() => import("@/pages/NotFound"));
const ErrorPage = lazy(() => import("@/pages/RouteErrorBoundary"));

export function RouteErrorBoundary() {
  return (
    <PageBoundary>
      <ErrorPage />
    </PageBoundary>
  );
}
