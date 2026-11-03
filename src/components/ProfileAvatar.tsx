import { Building } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { cn } from "cn";

function ProfileAvatar({ className, ...props }: React.ComponentProps<typeof Avatar>) {
  const { data: user, isLoading } = useUser();
  return (
    <Avatar className={cn("rounded-full size-12", className)} {...props}>
      {isLoading ? (
        <AvatarFallback>
          <Skeleton className="rounded-full size-full" />
        </AvatarFallback>
      ) : (
        <>
          <AvatarImage src={user?.fotoUrl ?? undefined} alt={user?.nome} />
          <AvatarFallback>
            <Building />
          </AvatarFallback>
        </>
      )}
    </Avatar>
  );
}

export default ProfileAvatar;
