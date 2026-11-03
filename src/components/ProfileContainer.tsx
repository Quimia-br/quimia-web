import { SidebarMenuItem } from "./ui/sidebar";
import { NavLink } from "react-router-dom";
import { cn } from "cn";
import ProfileAvatar from "./ProfileAvatar";

function ProfileContainer() {
  return (
    <SidebarMenuItem>
      <NavLink
        aria-label="Perfil"
        className={cn(
          "inline-flex items-center self-stretch justify-center px-4 py-3 rounded-full h-16 bg-secondary outline-none",
          "aria-[current=page]:ring-primary aria-[current=page]:ring-3",
          "focus-visible:ring-3 focus-visible:ring-sidebar-ring",
        )}
        to="/profile"
      >
        <ProfileAvatar />
      </NavLink>
    </SidebarMenuItem>
  );
}

export default ProfileContainer;
