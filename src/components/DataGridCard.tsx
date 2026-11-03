import { cn } from "cn";
import type { ReactNode } from "react";
import Card from "./Card";
import CardHeader from "./CardHeader";

export interface DataGridCardProps {
  title: string;
  description?: string;
  media?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

/** Optional card composition matching the product grid; all content belongs to the caller. */
function DataGridCard({ title, description, media, actions, className }: DataGridCardProps) {
  return (
    <Card className={cn("h-full min-w-0 p-6 sm:p-8", className)}>
      <CardHeader
        title={title}
        description={description}
        className="min-w-0 [&_hgroup]:min-w-0 [&_p]:truncate"
      />
      {(media != null || actions != null) && (
        <div className="mt-auto flex min-h-[229px] min-w-0 items-end justify-between gap-4">
          {media != null && <div className="min-w-0 flex-1">{media}</div>}
          {actions != null && <div className="ms-auto flex shrink-0 flex-col gap-4">{actions}</div>}
        </div>
      )}
    </Card>
  );
}

export default DataGridCard;
