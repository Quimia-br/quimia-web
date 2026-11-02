import type { ReactNode } from "react";
import { cn } from "cn";
import FeedbackItem from "./FeedbackItem";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: ReactNode;
  role?: "status" | "alert";
  action?: ReactNode;
  className?: string;
}

function EmptyState({
  title,
  description,
  icon,
  role = "status",
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "mx-auto flex min-h-[285px] w-full max-w-[347px] flex-col items-center justify-center gap-[38px] py-8 text-center whitespace-normal",
        className,
      )}
    >
      <FeedbackItem
        className="h-[90px] w-25 shrink-0"
        icon={
          <span aria-hidden="true" className="[&_svg]:size-10">
            {icon}
          </span>
        }
      />
      <div role={role} className="flex flex-col items-center gap-2.5 font-medium">
        <h2 className="text-xl leading-[1.2] tracking-[-0.005em] text-foreground-primary">
          {title}
        </h2>
        <p className="max-w-[308px] text-sm leading-[17px] text-foreground-subtle">{description}</p>
      </div>
      {action != null && <div className="w-full">{action}</div>}
    </div>
  );
}

export default EmptyState;
