import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "cn";
import FeedbackItem from "@/components/FeedbackItem";
import { AuthBackground } from "@/components/AuthLayout";
import { Check, X } from "lucide-react";

interface AuthFeedbackProps {
  variant: "success" | "error";
  title: string;
  description?: string;
  children: ReactNode;
  extraGlow?: boolean;
}

export default function AuthFeedback({
  variant,
  title,
  description,
  children,
  extraGlow = true,
}: AuthFeedbackProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);

  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-clip bg-surface-background px-6 py-12">
      <AuthBackground feedback extraGlow={extraGlow} />
      <section
        className="flex w-[442px] max-w-full flex-col items-center gap-[43px] text-center max-[480px]:gap-8"
        aria-labelledby="auth-feedback-title"
      >
        <div aria-hidden="true" data-slot="auth-feedback-icon" className="shrink-0">
          <FeedbackItem
            variant={variant}
            size="big"
            className={cn(
              "size-[298px] border-5 ring-0 max-[480px]:size-[222px]",
              variant === "success" ? "border-feedback-success" : "border-feedback-error",
            )}
            icon={variant === "success" ? <Check size={49} /> : <X size={49} />}
          />
        </div>
        <div
          className="flex flex-col items-center gap-3"
          role={variant === "error" ? "alert" : "status"}
        >
          <h1
            id="auth-feedback-title"
            ref={heading}
            tabIndex={-1}
            className={cn(
              "max-w-[calc(100vw-48px)] text-4xl font-medium leading-[1.55] outline-none max-[480px]:text-[28px] max-[480px]:leading-[1.3]",
              variant === "success" ? "w-[442px]" : "w-[520px]",
            )}
          >
            {title}
          </h1>
          {description && <p className="text-base text-foreground">{description}</p>}
        </div>
        <div className="flex w-full flex-col items-center gap-3">{children}</div>
      </section>
    </main>
  );
}
