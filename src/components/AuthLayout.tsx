import type { ReactNode } from "react";
import { cn } from "cn";
import MainTitle from "./MainTitle";
import Logo from "./Logo";

function AuthGlow({ className }: { className: string }) {
  return (
    <div
      className={cn(
        "absolute flex h-[1493.242px] w-[1438.094px] items-center justify-center",
        className,
      )}
    >
      <div className="relative h-[1174px] w-[1073px] flex-none rotate-[22.29deg]">
      </div>
    </div>
  );
}

export function AuthBackground({
  feedback = false,
  extraGlow = true,
}: {
  feedback?: boolean;
  extraGlow?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-1 overflow-hidden dark:opacity-30"
    >
      <AuthGlow
        className={
          feedback
            ? "left-[-847px] top-[-129px]"
            : "left-[-600px] top-[-290px] max-lg:left-[-950px]"
        }
      />
      {feedback && (
        <>
          {extraGlow && <AuthGlow className="left-[-1138px] top-[147px]" />}
          <AuthGlow className="left-[calc(100%-445px)] top-[-593px]" />
        </>
      )}
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate grid min-h-svh grid-cols-[minmax(0,574px)] justify-center gap-12 overflow-clip bg-surface-background px-6 py-12 max-[480px]:px-5 max-[480px]:py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,574px)] lg:py-[76px] lg:pr-[max(32px,calc((100vw_-_1182px)/2))] lg:pl-[max(32px,calc((100vw_-_1288px)/2))]">
      <AuthBackground />
      <section className="hidden lg:flex flex flex-row justify-around w-full lg:flex-col sm:items-center lg:flex-1 lg:items-start lg:justify-end">
        <MainTitle className="flex flex-1 max-w-sm text-5xl lg:flex-none" title="Recuperar senha" />

        <Logo className="lg:absolute lg:w-[1070px] w-24 origin-top-left lg:rotate-[22.29deg] lg:opacity-60 lg:blur-[253.45px] lg:-left-32  lg:block lg:-top-96 -z-1 overflow-hidden lg:dark:-left-64" />
      </section>
      <section className="flex min-w-0 flex-col justify-center gap-[47px] max-[480px]:gap-8 [&_hgroup]:flex [&_hgroup]:flex-col [&_hgroup]:gap-4 [&_form]:gap-[47px] max-[480px]:[&_form]:gap-8 [&_[data-slot=form-field]>div]:gap-4 [&_[data-slot=input-group]]:min-h-16 [&_[data-slot=input-group-control]]:text-[16px] max-[480px]:[&_h1]:text-[30px] max-[480px]:[&_hgroup_p]:text-xl max-[480px]:[&_hgroup_p]:leading-[1.3]">
        {children}
      </section>
    </main>
  );
}
