import { Building } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { SidebarMenuItem } from "./ui/sidebar";
import { useUser } from "@/hooks/use-user";
import { NavLink } from "react-router-dom";
import { cn } from "cn";
import Skeleton from "./smoothui/skeleton-loader";

function ProfileContainer() {
  const { data: user, isLoading } = useUser();

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
        <Avatar className="rounded-full size-12">
          {isLoading ? (
            <AvatarFallback>
              <Skeleton className="rounded-full size-full" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src={user?.fotoUrl} alt={user?.nome} />
              <AvatarFallback>
                <Building />
              </AvatarFallback>
            </>
          )}
        </Avatar>
      </NavLink>
    </SidebarMenuItem>
  );
}

export default ProfileContainer;
