import { Plus } from "lucide-react";
import { Button } from "./ui/button";

function AddButton() {
  return (
    <Button
      className="rounded-full"
      aria-label="Add"
      onClick={() => {}}
      size="icon-md"
    >
      <Plus />
    </Button>
  );
}

export default AddButton;
