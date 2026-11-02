import { useContext } from "react";
import { Menu } from "lucide-react";
import { SidebarContext } from "@/lib/sidebar-context";
import { Button } from "./ui/button";

export default function MobileMenuTrigger() {
  const sidebar = useContext(SidebarContext);
  if (!sidebar) return null;

  return (
    <Button
      type="button"
      variant="onColor"
      size="icon-sm"
      className="size-[50px] rounded-full md:hidden"
      aria-label={sidebar.openMobile ? "Fechar menu" : "Abrir menu"}
      aria-expanded={sidebar.openMobile}
      aria-controls="main-navigation"
      data-mobile-menu-trigger=""
      onClick={sidebar.toggleSidebar}
    >
      <Menu aria-hidden="true" />
    </Button>
  );
}
