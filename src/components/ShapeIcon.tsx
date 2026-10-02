import * as React from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { cn } from "cn";
import { SidebarMenuItem } from "@/components/ui/sidebar";

type ShapeIconProps = Omit<React.ComponentProps<typeof NavLink>, "children"> & {
  icon: LucideIcon;
  label: string;
};

function ShapeIcon({
  to,
  icon: Icon,
  label,
  className,
  end,
  ...props
}: ShapeIconProps) {
  const shouldEnd = end ?? (to === "/");

  return (
    <SidebarMenuItem>
      <NavLink
        to={to}
        end={shouldEnd}
        data-slot="sidebar-nav-item"
        className={cn(
          "group flex flex-col items-center gap-2 rounded-full outline-none",
          "focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          typeof className === "string" && className,
        )}
        {...props}
      >
        <span
          className={cn(
            "relative grid size-18 place-items-center rounded-full transition-colors",
            "bg-secondary group-hover:bg-secondary-hover",
            "group-aria-[current=page]:bg-primary group-aria-[current=page]:text-primary-foreground",
            "[&_svg:not([class*='size-'])]:size-8",
          )}
        >
          <Icon aria-hidden />
        </span>

        <span className="font-medium text-base text-sidebar-foreground transition-colors group-aria-[current=page]:text-sidebar-foreground">
          {label}
        </span>
      </NavLink>
    </SidebarMenuItem>
  );
}

export default ShapeIcon;
