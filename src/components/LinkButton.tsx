import { cn } from "cn";
import React from "react";
import { buttonVariants } from "./ui/button-variants";
import { Link } from "react-router-dom";

function LinkButton({
  className,
  ...linkProps
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        buttonVariants({ variant: "link", className: "text-base" }),
        className,
      )}
      {...linkProps}
    >
      Entre aqui
    </Link>
  );
}

export default LinkButton;
