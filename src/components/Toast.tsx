import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { Check, CircleAlert, Info, LoaderCircle, X } from "lucide-react";
import { cn } from "cn";
import { useToast } from "@/hooks/use-toast";

export function ToastProvider(props: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />;
}

type ToastViewportProps = {
  align?: "start" | "center" | "end";
  label?: string;
  className?: string;
};

/** Place inside the screen's action row or below its header, as in Figma. */
export function ToastViewport({ align = "start", label = "Notificações", className }: ToastViewportProps) {
  const { toasts } = useToast();
  return (
    <ToastPrimitive.Viewport
      aria-label={label}
      hidden={toasts.length === 0}
      className={cn("flex min-w-0 flex-col gap-3 outline-none", align === "end" ? "items-end" : align === "center" ? "items-center" : "items-start", className)}
    >
      {toasts.map(toast => <Toast key={toast.id} toast={toast} />)}
    </ToastPrimitive.Viewport>
  );
}

type ToastProps = {
  toast: ToastPrimitive.Root.ToastObject;
  className?: string;
};

function ToastSymbol({ type }: { type: ToastPrimitive.Root.ToastObject["type"] }) {
  const error = type === "error";
  const warning = type === "warning";
  const loading = type === "loading";
  const Icon = error ? X : warning ? CircleAlert : loading ? LoaderCircle : type === "info" ? Info : Check;
  return (
    <span aria-hidden="true" className={cn("flex size-[42px] shrink-0 items-center justify-center rounded-full", error ? "bg-feedback-error text-foreground-on-color" : warning ? "bg-feedback-warning text-foreground-primary" : "bg-secondary text-foreground-primary")}>
      <Icon className={cn("size-5", loading && "motion-safe:animate-spin")} />
    </span>
  );
}

function ToastText({ toast }: { toast: ToastProps["toast"] }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 text-left font-medium">
      {toast.title != null && <ToastPrimitive.Title className="text-xl leading-6 wrap-anywhere" />}
      {toast.description != null && <ToastPrimitive.Description className={toast.title != null ? "text-sm leading-[17px] text-foreground-subtle wrap-anywhere" : "text-xl leading-6 wrap-anywhere"} />}
      {toast.actionProps && <ToastPrimitive.Action className="w-fit cursor-pointer rounded text-sm text-foreground-primary underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-50" />}
    </div>
  );
}

export default function Toast({ toast, className }: ToastProps) {
  const loading = toast.type === "loading";
  return (
    <ToastPrimitive.Root
      toast={toast}
      aria-busy={loading || undefined}
      className={cn(
        "w-fit max-w-full rounded-full bg-card p-4 text-foreground-primary outline-none focus-visible:ring-2 focus-visible:ring-border-focus data-limited:hidden",
        "transition-[opacity,translate] duration-200 ease-out data-starting-style:-translate-y-2 data-starting-style:opacity-0 data-ending-style:translate-y-2 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
    >
      <ToastPrimitive.Content className="flex items-center gap-4 sm:gap-[70px]">
        <div className="flex min-w-0 items-center gap-5">
          <ToastSymbol type={toast.type} />
          <ToastText toast={toast} />
        </div>
        <ToastPrimitive.Close aria-label="Fechar notificação" className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground-subtle outline-none focus-visible:ring-2 focus-visible:ring-border-focus">
          <X aria-hidden="true" className="size-6" />
        </ToastPrimitive.Close>
      </ToastPrimitive.Content>
    </ToastPrimitive.Root>
  );
}
