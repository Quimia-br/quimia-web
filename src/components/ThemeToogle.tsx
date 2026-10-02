import useTheme from "@/hooks/use-theme";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

function ThemeToogle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Button
      className="rounded-full"
      aria-label={isDark ? "Light" : "Dark" + " theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      variant="onColor"
      size="icon-md"
    >
      {isDark ? <Moon /> : <Sun />}
    </Button>
  );
}

export default ThemeToogle;
