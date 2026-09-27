import { useState } from "react";
import TextField from "../components/TextField";
import MainTitle from "@/components/MainTitle";
import { Moon, Sun } from "lucide-react";
import { useViteTheme } from "@space-man/react-theme-animation";
import { Button } from "@/components/ui/button";

function Home() {
  const [value, setValue] = useState("");
  const { ref, resolvedTheme, toggleTheme } = useViteTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <main className="grid grid-cols-2 gap-5 p-6 align-middle justify-center">
      <MainTitle title="Title" description="Description" />
      <Button
        ref={ref}
        aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
        onClick={() => toggleTheme()}
        size="icon"
      >
        {isDark ? <Moon /> : <Sun />}
      </Button>
      <TextField
        label="Label"
        placeholder="Example"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        description="Description"
      />
    </main>
  );
}

export default Home;
