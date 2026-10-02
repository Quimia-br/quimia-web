import MainTitle from "@/components/MainTitle";
import ThemeToogle from "@/components/ThemeToogle";

function Graphs() {
  return (
    <>
      <header className="flex items-center px-4">
        <MainTitle className="flex-1" title="Estatísticas" />
        <ThemeToogle />
      </header>
    </>
  );
}

export default Graphs;
