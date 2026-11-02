import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import type { ComponentProps } from "react";

function AddButton(props: ComponentProps<typeof Button>) {
  return (
    <Button className="rounded-full" aria-label="Add" size="icon-md" {...props}>
      <Plus />
    </Button>
  );
}

export default AddButton;
