import useTheme from "@/hooks/use-theme";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

function ThemeToogle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      className="rounded-full"
      aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      variant="onColor"
      size="icon-md"
    >
      {isDark ? <Moon /> : <Sun />}
    </Button>
  );
}

export default ThemeToogle;
