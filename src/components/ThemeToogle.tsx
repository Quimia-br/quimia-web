import useTheme from "@/hooks/use-theme";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";
import { cn } from "cn";

function ThemeToogle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      className={cn("size-[50px] rounded-full md:size-16", className)}
      aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      variant="onColor"
      size="icon-md"
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

export default ThemeToogle;
