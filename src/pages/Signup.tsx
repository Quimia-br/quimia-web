import MainTitle from "@/components/MainTitle";
import Logo from "@/components/Logo";
import SignupForm from "@/components/signup/SignupForm";

function Signup() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen gap-10 px-5 py-8 overflow-hidden lg:items-stretch sm:px-8 sm:py-12 lg:px-12 lg:flex-row lg:justify-between xl:px-24">
      <section className="flex flex-row justify-around w-full lg:flex-col sm:items-center lg:flex-1 lg:items-start lg:justify-end">
        <MainTitle
          className="max-w-md text-[1rem] flex flex-1 lg:flex-none"
          title="Transforme a forma como você limpa sua casa"
        />

        <Logo className="lg:absolute lg:w-[1070px] w-24 origin-top-left lg:rotate-[22.29deg] lg:opacity-60 lg:blur-[253.45px] lg:-left-32  lg:block lg:-top-96 -z-1 overflow-hidden lg:dark:-left-64" />
      </section>

      <section className="flex items-center justify-center w-full lg:flex-1">
        <article className="flex flex-col gap-8">
          <MainTitle
            className="text-[0.85rem]"
            title="Cadastre sua empresa no Quimia!"
            description="Preencha as informações abaixo"
          />

          <SignupForm />
        </article>
      </section>
    </main>
  );
}

export default Signup;
