import { useId, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "cn";

interface RouteMainProps extends ComponentPropsWithoutRef<"main"> {
  children?: ReactNode;
}

export default function RouteMain({ id, className, ...props }: RouteMainProps) {
  const generatedId = useId();
  return (
    <main
      {...props}
      id={id ?? `conteudo-principal-${generatedId}`}
      data-route-content
      tabIndex={-1}
      className={cn(
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
    />
  );
}
