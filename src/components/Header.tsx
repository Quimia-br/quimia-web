import type { ComponentPropsWithoutRef } from "react";
import { cn } from "cn";
import MainTitle from "./MainTitle";
import ThemeToogle from "./ThemeToogle";

interface HeaderProps extends Omit<
  ComponentPropsWithoutRef<"header">,
  "title" | "children"
> {
  title: string;
  description?: string;
}

function Header({ title, description, className, ...props }: HeaderProps) {
  return (
    <header
      {...props}
      className={cn(
        "flex min-w-0 flex-col gap-6 px-4 lg:flex-row lg:items-center",
        className,
      )}
    >
      <MainTitle
        title={title}
        description={description}
        className="min-w-0 flex-1 wrap-break-word"
      />

      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <ThemeToogle />
      </div>
    </header>
  );
}

export default Header;
