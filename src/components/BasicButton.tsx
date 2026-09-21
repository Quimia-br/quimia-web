import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

type BasicButtonProps = Omit<
  ComponentProps<typeof Button>,
  "size" | "variant"
> & {
  icon?: ReactNode;
  variant?: "primary" | "secondary";
};

function BasicButton({
  children,
  className,
  icon,
  type = "button",
  variant = "primary",
  ...props
}: BasicButtonProps) {
  return (
    <Button
      type={type}
      variant={variant === "primary" ? "default" : "secondary"}
      size="basic"
      className={cn("relative", className)}
      {...props}
    >
      {icon && (
        <span
          aria-hidden="true"
          data-slot="button-icon"
          className="absolute left-3 flex size-4 items-center justify-center [&>svg]:size-full"
        >
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </Button>
  );
}

export default BasicButton;
