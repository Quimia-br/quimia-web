import * as React from "react";
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import { cn } from "cn";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { Label } from "./ui/label";
import { useId } from "react";

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
  const shouldEnd = end ?? to === "/";
  const id = useId();

  return (
    <SidebarMenuItem className="flex flex-col justify-center items-center">
      <NavLink
        to={to}
        end={shouldEnd}
        aria-labelledby={id}
        data-slot="sidebar-nav-item"
        className={(state) => cn(
          "flex justify-center items-center rounded-full outline-none",
          "focus-visible:ring-3 focus-visible:ring-sidebar-ring",
          "relative grid size-18 rounded-full transition-colors",
          "bg-secondary hover:bg-secondary-hover",
          "aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground",
          "[&_svg:not([class*='size-'])]:size-8",
          typeof className === "function" ? className(state) : className,
        )}
        {...props}
      >
        <Icon aria-hidden />
      </NavLink>
      <Label id={id} className="font-medium text-base text-sidebar-foreground">
        {label}
      </Label>
    </SidebarMenuItem>
  );
}

export default ShapeIcon;
