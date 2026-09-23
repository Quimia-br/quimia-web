import { useState } from "react";
import TextField from "../components/TextField";
import MainTitle from "@/components/MainTitle";
import BasicButton from "@/components/BasicButton";
import { Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

function Home() {
  const [value, setValue] = useState("");
  const element = document.documentElement;
  const toggleTheme = () => {
    element?.classList.toggle("dark");
  };

  return (
    <main className="grid grid-cols-2 gap-5 p-6 align-middle justify-center">
      <MainTitle title="Title" description="Description" />
      <BasicButton onClick={toggleTheme} icon={<Circle />}>
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
      <Badge>
        1
      </Badge>
    </main>
  );
}

export default Home;
