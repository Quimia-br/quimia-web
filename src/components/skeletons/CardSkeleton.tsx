import { cn } from "cn";
import Card from "../Card";
import { Skeleton } from "../ui/skeleton";

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className="h-full">
      <Card className={cn("h-full min-w-0 p-6 sm:p-8", className)}>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 w-3/4 rounded-full motion-reduce:animate-none" />
          <Skeleton className="h-5 w-1/2 rounded-full motion-reduce:animate-none" />
        </div>
        <Skeleton className="mt-auto h-[229px] w-full rounded-3xl motion-reduce:animate-none" />
      </Card>
    </div>
  );
}

export default CardSkeleton;
