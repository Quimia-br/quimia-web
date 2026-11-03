import FeedbackItem from "@/components/FeedbackItem";
import Logo from "@/components/Logo";
import { WifiIcon } from "@/components/ui/wifi";

function GenericError() {
  return (
    <main className="relative isolate flex min-h-dvh w-full items-center justify-center overflow-hidden bg-background px-6 py-12 sm:px-10">
      <Logo className="pointer-events-none absolute -bottom-[48rem] -left-[71rem] -z-10 w-[1073px] rotate-[22.29deg] opacity-60 blur-[253.45px]" />
      <div className="flex w-full max-w-[1029px] flex-col items-center gap-8 lg:flex-row lg:gap-[86px]">
        <FeedbackItem
          icon={<WifiIcon aria-hidden="true" className="size-20" />}
          variant="error"
          size="big"
          className="size-48 shrink-0 ring-5 sm:size-60 lg:size-72"
        />
        <hgroup className="flex min-w-0 flex-col gap-5 text-center font-medium lg:text-left">
          <h1 className="text-4xl leading-[1.2] text-foreground sm:text-5xl lg:text-[64px]">
            Verifique sua conexão
          </h1>
          <p className="max-w-[543px] text-xl leading-[1.2] text-muted-foreground sm:text-2xl">
            Encontramos um problema de conexão. Por favor, tente novamente mais tarde
          </p>
        </hgroup>
      </div>
      <Logo className="pointer-events-none absolute -right-[40rem] -top-[30rem] -z-10 w-[1073px] rotate-[22.29deg] opacity-60 blur-[253.45px]" />
    </main>
  );
}

export default GenericError;
