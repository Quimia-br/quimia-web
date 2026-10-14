import FeedbackItem from "@/components/FeedbackItem";
import Logo from "@/components/Logo";
import { WifiIcon } from "@/components/ui/wifi";

function GenericError() {
  return (
    <div className="flex items-center justify-center h-full overflow-hidden">
      <Logo className="absolute lg:w-[1070px] w-24 rotate-[22.29deg] opacity-60 blur-[253.45px] -left-[50rem] -bottom-[30rem] -z-2" />
      <div className="flex flex-col items-center gap-8 lg:flex-row md:gap-20">
        <FeedbackItem icon={<WifiIcon />} variant="error" size="big" />
        <hgroup className="flex flex-col max-w-2xl gap-5 font-medium text-center lg:text-left">
          <h1 className="text-5xl md:text-[64px] text-foreground">
            Verifique sua conexão
          </h1>
          <p className="text-xl text-muted-foreground md:text-2xl">
            Encontramos um problema de conexão. Por favor, tente novamente mais
            tarde
          </p>
        </hgroup>
      </div>
      <Logo className="absolute lg:w-[1070px] w-24 rotate-[22.29deg] opacity-60 blur-[253.45px] -right-[40rem] -top-[30rem] -z-2" />
    </div>
  );
}

export default GenericError;
