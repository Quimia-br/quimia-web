import type { ComponentPropsWithoutRef } from "react";
import { cn } from "cn";
import MainTitle from "./MainTitle";
import ThemeToogle from "./ThemeToogle";
import MobileMenuTrigger from "./MobileMenuTrigger";

interface HeaderProps extends Omit<ComponentPropsWithoutRef<"header">, "title" | "children"> {
  title: string;
  description?: string;
  mobileTitle?: string;
  mobileThemeInActions?: boolean;
}

function Header({
  title,
  description,
  mobileTitle,
  mobileThemeInActions = false,
  className,
  ...props
}: HeaderProps) {
  return (
    <header
      {...props}
      className={cn(
        "flex min-h-[70px] min-w-0 shrink-0 items-center gap-4 md:flex-col md:items-stretch md:gap-6 md:px-4 lg:flex-row lg:items-center",
        className,
      )}
    >
      <MobileMenuTrigger />
      <MainTitle
        title={title}
        description={description}
        className={cn(
          "min-w-0 flex-1 text-2xl wrap-break-word md:text-4xl",
          mobileTitle && "hidden md:block",
        )}
      />
      {mobileTitle && (
        <MainTitle
          title={mobileTitle}
          description={description}
          className="min-w-0 flex-1 text-2xl wrap-break-word md:hidden"
        />
      )}

      <div
        className={cn(
          "flex shrink-0 flex-wrap items-center gap-3",
          mobileThemeInActions && "hidden md:flex",
        )}
      >
        <ThemeToogle />
      </div>
    </header>
  );
}

export default Header;
