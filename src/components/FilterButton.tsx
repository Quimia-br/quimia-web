import { Settings2 } from "lucide-react";
import { Button } from "./ui/button";
import type { MouseEventHandler } from "react";

interface FilterButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  "aria-expanded"?: boolean;
  "aria-controls"?: string;
  disabled?: boolean;
  title?: string;
}

function FilterButton({ onClick, disabled, title = "Filtros", ...props }: FilterButtonProps) {
  return (
    <Button
      className="rounded-full"
      type="button"
      aria-label={title}
      title={title}
      disabled={disabled}
      onClick={onClick}
      {...props}
      variant="onColor"
      size="icon-md"
    >
      <Settings2 />
    </Button>
  );
}

export default FilterButton;
