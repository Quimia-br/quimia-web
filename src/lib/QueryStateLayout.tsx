import { Outlet } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import RouteAccessibility from "@/components/RouteAccessibility";

export default function QueryStateLayout() {
  return (
    <NuqsAdapter>
      <RouteAccessibility />
      <Outlet />
    </NuqsAdapter>
  );
}
