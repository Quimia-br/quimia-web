import type { ComponentPropsWithRef } from "react";
import { cn } from "cn";
import { Skeleton } from "../ui/skeleton";
import { chartCardClassName } from "@/lib/chart-card-styles";

export interface ChartSkeletonProps extends Omit<ComponentPropsWithRef<"div">, "children"> {
  label?: string;
  showCaption?: boolean;
  contentClassName?: string;
}

const placeholderClassName = "rounded-3xl bg-linear-to-l from-secondary-hover from-[38.042%] to-secondary-primary motion-reduce:animate-none";

function ChartSkeleton({ label = "Carregando gráfico", showCaption = true, contentClassName, className, ...props }: ChartSkeletonProps) {
  return (
    <div {...props} role="status" aria-label={label} aria-busy="true" className={cn(chartCardClassName, className)}>
      <span className="sr-only">{label}</span>
      <Skeleton aria-hidden="true" className={cn(placeholderClassName, "h-[61px]")} />
      <Skeleton aria-hidden="true" className={cn(placeholderClassName, "h-[229px]", contentClassName)} />
      {showCaption && <Skeleton aria-hidden="true" className={cn(placeholderClassName, "h-[61px]")} />}
    </div>
  );
}

export default ChartSkeleton;
