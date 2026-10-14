import { Toggle } from "@base-ui/react/toggle";
import { cn } from "cn";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { Button } from "./ui/button";

const chipBase = "inline-flex min-h-[43px] max-w-full cursor-pointer items-center justify-center gap-2.5 rounded-full px-6 py-3 text-base font-medium leading-[19px] outline-none transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-3 focus-visible:ring-border-focus disabled:cursor-not-allowed disabled:opacity-50";

interface ChipProps extends Omit<Toggle.Props, "children" | "render" | "nativeButton" | "type"> {
  children: ReactNode;
}

function Chip({ children, className, ...props }: ChipProps) {
  return (
    <Toggle
      {...props}
      type="button"
      className={(state) => cn(
        chipBase,
        state.pressed
          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
          : "bg-surface-base text-foreground-primary hover:bg-secondary-hover",
        typeof className === "function" ? className(state) : className,
      )}
      render={(buttonProps) => (
        <button {...buttonProps}>
          <span className="min-w-0 text-center wrap-break-word">{children}</span>
        </button>
      )}
    />
  );
}

function ChipAction({ children, className, type = "button", ...props }: ComponentPropsWithRef<"button">) {
  return (
    <Button
      {...props}
      type={type}
      className={cn(chipBase, "bg-surface-base text-foreground-primary hover:bg-secondary-hover", className)}
    >
      {children}
    </Button>
  );
}

export { ChipAction };
export default Chip;
