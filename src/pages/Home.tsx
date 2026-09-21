import { useState } from "react";
import TextField from "../components/TextField";
import MainTitle from "@/components/MainTitle";
import BasicButton from "@/components/BasicButton";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";

function Home() {
  const [value, setValue] = useState("")
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <main className="grid grid-cols-2 gap-5 p-6 align-middle justify-center">
      <MainTitle
        title="Title"
        description="Description"
      />
      <BasicButton
        onClick={toggleTheme}
        icon={theme === "dark" ? <Moon /> : <Sun />}
        aria-label={`Switch to ${nextTheme} theme`}
      >
        Theme
      </BasicButton>
      <TextField
        label="Label"
        placeholder="Example"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        description="Description"
      />
      <TextField
        label="Label"
        placeholder="Example"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue("")}
        description="Description"
        />
      <TextField
        label="Label"
        placeholder="Example"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        description="Description"
        error="Error description"
      />
      <TextField
        label="Label"
        placeholder="Example"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onClear={() => setValue("")}
        description="Description"
        error="Error description"
      />
    </main>
  )
}

export default Home
