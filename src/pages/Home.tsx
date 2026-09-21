import { useState } from "react";
import TextField from "../components/TextField";
import MainTitle from "@/components/MainTitle";
import { Button } from "@/components/ui/button";

function Home() {
  const [value, setValue] = useState("")
  const element = document.documentElement
  const toggleTheme = () => {
    element?.classList.toggle("dark")
  }

  return (
    <main className="grid grid-cols-2 gap-5 p-6 align-middle justify-center">
      <MainTitle
        title="Title"
        description="Description"
      />
      <Button
        onClick={toggleTheme}
      >
        Theme
      </Button>
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
