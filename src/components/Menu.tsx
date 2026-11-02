import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarMenu } from "./ui/sidebar";
import ShapeIcon from "./ShapeIcon";
import ProfileContainer from "./ProfileContainer";
import { HomeIcon, SoapDispenserDroplet, TrendingUp } from "lucide-react";
import { useEffect } from "react";
import { useSidebar } from "@/hooks/use-sidebar";

const links = [
  { label: "Home", to: "/", icon: HomeIcon },
  {
    label: "Produtos",
    to: "/products",
    icon: SoapDispenserDroplet,
  },
  { label: "Estatísticas", to: "/graphs", icon: TrendingUp },
];

function Menu() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  useEffect(() => {
    if (!isMobile || !openMobile) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      setOpenMobile(false);
      document.querySelector<HTMLButtonElement>("[data-mobile-menu-trigger]")?.focus();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobile, openMobile, setOpenMobile]);

  if (isMobile && !openMobile) return null;

  return (
    <Sidebar
      id="main-navigation"
      role="navigation"
      aria-label="Menu principal"
      onClick={(event) => {
        if (isMobile && (event.target as Element).closest("a[href]")) setOpenMobile(false);
      }}
      side="left"
      collapsible="none"
      variant="sidebar"
      className="h-full w-[214px] shrink-0 flex-col items-stretch self-stretch rounded-[60px] bg-surface-base p-8 md:w-fit md:max-w-40"
    >
      <SidebarContent className="min-w-0 overflow-x-hidden overflow-y-auto">
        <SidebarGroup className="p-0">
          <SidebarMenu className="flex flex-col items-stretch gap-[30px] md:gap-6 [&>li]:gap-2 md:[&>li]:gap-0">
            {links.map((link) => (
              <ShapeIcon key={link.to} {...link} className="h-[90px] w-full md:size-18" />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto p-0 md:p-2 [&_a]:w-full [&_a]:h-[74px] md:[&_a]:h-16">
        <SidebarMenu>
          <ProfileContainer />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default Menu;
