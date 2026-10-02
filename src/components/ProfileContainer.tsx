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
        className={cn(
          "inline-flex items-center self-stretch justify-center px-4 py-3 rounded-full h-16 bg-secondary",
          "aria-[current=page]:ring-primary aria-[current=page]:ring-3",
        )}
        to="/profile"
      >
        <Avatar className="rounded-full size-12">
          {isLoading ? (
            <AvatarFallback>
              <Skeleton className="size-full rounded-full" />
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
