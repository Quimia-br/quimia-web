import { Grid2X2, Menu } from "lucide-react";
import { Button } from "./ui/button";
import useDataDisplay from "@/hooks/use-data-display";

function DataDisplayToggle() {
  const { dataDisplay, setDataDisplay } = useDataDisplay();
  const isTable = dataDisplay === "table";
  return (
    <Button
      type="button"
      className="rounded-full"
      aria-label={isTable ? "Alternar para visualização em grade" : "Alternar para visualização em tabela"}
      onClick={() => setDataDisplay(isTable ? "grid" : "table")}
      variant="onColor"
      size="icon-md"
    >
      {isTable ? <Menu /> : <Grid2X2 />}
    </Button>
  );
}

export default DataDisplayToggle;
