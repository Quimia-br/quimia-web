import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { chartCardClassName } from "@/lib/chart-card-styles";

export interface ChartProps extends Omit<ComponentPropsWithRef<"article">, "title" | "children"> {
  title: string;
  description?: string;
  children: ReactNode;
  icon?: LucideIcon | false;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  captionTitle?: string;
  captionDescription?: string;
  contentClassName?: string;
}

function Chart({ title, description, children, icon: Icon, headingLevel = 2, captionTitle, captionDescription, contentClassName, className, ...props }: ChartProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <article {...props} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} className={cn(chartCardClassName, className)}>
      <header className="flex min-w-0 items-center gap-[21px]">
        {Icon && <Icon aria-hidden="true" className="size-6 shrink-0" />}
        <div className="flex flex-col flex-1 min-w-0 gap-2">
          <Heading id={titleId} className="text-xl font-medium leading-none wrap-break-word">{title}</Heading>
          {description && <p id={descriptionId} className="text-sm font-medium leading-none text-foreground-subtle wrap-break-word">{description}</p>}
        </div>
      </header>
      <div className={cn("h-[207px] min-w-0", contentClassName)}>{children}</div>
      {(captionTitle || captionDescription) && (
        <footer className="flex flex-col min-w-0 gap-2">
          {captionTitle && <p className="text-base font-medium leading-none wrap-break-word">{captionTitle}</p>}
          {captionDescription && <p className="text-xs font-medium leading-none text-foreground-subtle wrap-break-word">{captionDescription}</p>}
        </footer>
      )}
    </article>
  );
}

export default Chart;
