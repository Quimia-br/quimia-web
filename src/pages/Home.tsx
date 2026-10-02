import MainTitle from "@/components/MainTitle";
import ThemeToogle from "@/components/ThemeToogle";

function Home() {
  return (
    <>
      <header className="flex items-center px-4">
        <MainTitle className="flex-1" title="Home" />
        <ThemeToogle />
      </header>
    </>
  );
}

export default Home;
