import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
} from "./ui/sidebar";
import ShapeIcon from "./ShapeIcon";
import ProfileContainer from "./ProfileContainer";
import { HomeIcon, SoapDispenserDroplet, TrendingUp } from "lucide-react";

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
  return (
    <Sidebar
      side="left"
      collapsible="none"
      variant="sidebar"
      className="bg-surface-base rounded-[60px] p-8 max-w-40 w-fit self-stretch"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="flex flex-col gap-6 items-center">
            {links.map((link) => (
              <ShapeIcon key={link.to} {...link} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <ProfileContainer />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default Menu;
