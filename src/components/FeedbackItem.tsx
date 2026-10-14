import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "cn";

interface FeedbackItemProps {
  icon: React.ReactNode;
  variant?: "default" | "success" | "error";
  size?: "big" | "medium" | "small";
  className?: string;
}

const feedbackItemVariants = cva(
  "rounded-full [&_svg]:shrink-0 [&_svg]:size-12 bg-secondary flex items-center justify-center",
  {
    variants: {
      variant: {
        default: "text-foreground",
        success: "ring-3 ring-feedback-success text-feedback-success",
        error: "ring-3 ring-feedback-error text-feedback-error",
      },
      size: {
        big: "size-72",
        medium: "size-56",
        small: "size-40",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "medium",
    },
  },
);

function FeedbackItem({ icon, variant, size, className }: FeedbackItemProps) {
  return (
    <div className={cn(feedbackItemVariants({ variant, size }), className)}>
      {icon}
    </div>
  );
}

export default FeedbackItem;
