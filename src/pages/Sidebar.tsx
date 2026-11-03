import { SidebarProvider } from "../components/ui/sidebar";
import Menu from "../components/Menu";
import { Outlet } from "react-router-dom";
import RouteMain from "@/components/RouteMain";

function Sidebar() {
  return (
    <SidebarProvider className="relative flex h-dvh w-full flex-row gap-6 overflow-hidden p-6 md:gap-5 md:p-8">
      <Menu />
      <RouteMain className="flex w-full flex-none flex-col min-h-0 min-w-0 gap-6 overflow-y-auto md:w-auto md:flex-1">
        <Outlet />
      </RouteMain>
    </SidebarProvider>
  );
}

export default Sidebar;
