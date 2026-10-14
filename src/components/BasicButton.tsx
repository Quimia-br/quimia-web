import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface BasicButtonProps extends Omit<
  ComponentProps<typeof Button>,
  "size" | "variant"
> {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "critical";
  size?: "default" | "compact";
}

function BasicButton({
  children,
  className,
  icon,
  size = "default",
  type = "button",
  variant = "primary",
  ...props
}: BasicButtonProps) {
  return (
    <Button
      type={type}
      variant={variant === "primary" ? "default" : variant}
      size={size === "compact" ? "basic-compact" : "basic"}
      className={className}
      {...props}
    >
      {icon != null && (
        <span aria-hidden="true" className="inline-flex size-5 shrink-0 items-center justify-center [&_svg]:size-full">
          {icon}
        </span>
      )}
      <span className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 text-center whitespace-normal [overflow-wrap:anywhere]">
        {children}
      </span>
      {icon != null && <span aria-hidden="true" className="size-5 shrink-0" />}
    </Button>
  );
}

export default BasicButton;
