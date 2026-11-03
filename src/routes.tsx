import { createBrowserRouter, type RouteObject } from "react-router-dom";
import QueryStateLayout from "@/lib/QueryStateLayout";
import PageBoundary from "@/components/PageBoundary";
import PrivateRoute from "@/components/PrivateRoute";
import Sidebar from "@/pages/Sidebar";
import {
  Login,
  Signup,
  ResetPassword,
  PasswordResetSuccess,
  SignupSuccess,
  SignupError,
  Home,
  Products,
  ProductDetail,
  Graphs,
  Profile,
  NotFound,
  RouteErrorBoundary,
} from "@/pages/RoutePages";

const routes: RouteObject[] = [
  {
    path: "/login",
    element: (
      <PageBoundary>
        <Login />
      </PageBoundary>
    ),
  },
  {
    path: "/signup",
    element: (
      <PageBoundary>
        <Signup />
      </PageBoundary>
    ),
  },
  ...["/reset-password", "/recover-password", "/recuperar-senha"].map((path) => ({
    path,
    element: (
      <PageBoundary>
        <ResetPassword />
      </PageBoundary>
    ),
  })),
  {
    path: "/reset-password/success",
    element: (
      <PageBoundary>
        <PasswordResetSuccess />
      </PageBoundary>
    ),
  },
  {
    path: "/signup/success",
    element: (
      <PageBoundary>
        <SignupSuccess />
      </PageBoundary>
    ),
  },
  {
    path: "/signup/error",
    element: (
      <PageBoundary>
        <SignupError />
      </PageBoundary>
    ),
  },
  {
    Component: PrivateRoute,
    children: [
      {
        Component: Sidebar,
        children: [
          {
            path: "/",
            element: (
              <PageBoundary>
                <Home />
              </PageBoundary>
            ),
          },
          {
            path: "/products",
            element: (
              <PageBoundary>
                <Products />
              </PageBoundary>
            ),
          },
          {
            path: "/products/:productId",
            element: (
              <PageBoundary>
                <ProductDetail />
              </PageBoundary>
            ),
          },
          {
            path: "/graphs",
            element: (
              <PageBoundary>
                <Graphs />
              </PageBoundary>
            ),
          },
          {
            path: "/profile",
            element: (
              <PageBoundary>
                <Profile />
              </PageBoundary>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: (
      <PageBoundary>
        <NotFound />
      </PageBoundary>
    ),
  },
];

const router = createBrowserRouter([
  { Component: QueryStateLayout, ErrorBoundary: RouteErrorBoundary, children: routes },
]);
export default router;
