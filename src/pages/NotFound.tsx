import LinkButton from "@/components/LinkButton";
import Logo from "@/components/Logo";

function NotFound() {
  return (
    <main className="flex items-center justify-center h-screen overflow-hidden">
      <section className="relative">
        <Logo className="absolute lg:w-[1070px] w-24 rotate-[22.29deg] opacity-60 blur-[253.45px] -left-[50rem] -bottom-[30rem] -z-2" />
        <h1 className="opacity-50 -z-1 text-surface-base text-[650px] font-medium">
          404
        </h1>
        <Logo className="absolute lg:w-[1070px] w-24 rotate-[22.29deg] opacity-60 blur-[253.45px] -right-[50rem] -top-[30rem] -z-2" />
      </section>
      <div className="absolute flex flex-col gap-10">
        <hgroup className="text-xl text-center">
          <h1 className="font-medium text-[3em] text-text-primary">
            Página não encontrada
          </h1>
          <p className="font-normal text-text-secondary">
            Por favor recarregue a página ou volte para a Home
          </p>
        </hgroup>
        <LinkButton
          to="/"
          variant="default"
          className="w-full text-2xl rounded-full h-14"
        >
          Voltar para Home
        </LinkButton>
      </div>
    </main>
  );
}

export default NotFound;
