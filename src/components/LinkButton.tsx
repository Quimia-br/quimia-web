import { cn } from "cn";
import React from "react";
import type { VariantProps } from "class-variance-authority"
import { buttonVariants } from "./ui/button-variants";
import { Link } from "react-router-dom";

interface LinkButtonProps extends React.ComponentProps<typeof Link>, VariantProps<typeof buttonVariants> {}

function LinkButton({
  className,
  variant = "link",
  size = "default",
  ...linkProps
}: LinkButtonProps) {
  return (
    <Link
      className={cn(
        buttonVariants({ variant, size, className }),
        "text-base",
      )}
      {...linkProps}
    />
  );
}

export default LinkButton;
