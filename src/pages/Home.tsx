import { useState } from "react";
import TextField from "../components/TextField";

function Home() {
  const [value, setValue] = useState("")

  const body = document.querySelector("body")
  body?.classList.add("dark")

  return (
    <main className="p-lg grid grid-cols-2 gap-5">
      <TextField
        label="Label"
        placeholder="Example"
        value=""
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
        value=""
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
