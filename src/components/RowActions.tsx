import { Pencil, Trash } from "lucide-react";
import { cn } from "cn";
import { Button } from "./ui/button";

export interface RowActionsProps<T> {
  item: T;
  itemLabel?: string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  disabled?: boolean;
  className?: string;
}

function RowActions<T>({
  item,
  itemLabel,
  onEdit,
  onDelete,
  disabled = false,
  className,
}: RowActionsProps<T>) {
  if (!onEdit && !onDelete) return null;

  const editLabel = itemLabel ? `Editar ${itemLabel}` : "Editar registro";
  const deleteLabel = itemLabel ? `Excluir ${itemLabel}` : "Excluir registro";

  return (
    <div
      role="group"
      aria-label={itemLabel ? `Ações de ${itemLabel}` : "Ações do registro"}
      className={cn("inline-flex items-center gap-[22px]", className)}
    >
      {onEdit && (
        <Button
          type="button"
          variant="onColor"
          size="icon-sm"
          className="size-[50px] rounded-full"
          aria-label={editLabel}
          title={editLabel}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onEdit(item);
          }}
        >
          <Pencil aria-hidden="true" />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="critical"
          size="icon-sm"
          className="size-[50px] rounded-full"
          aria-label={deleteLabel}
          title={deleteLabel}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(item);
          }}
        >
          <Trash aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export default RowActions;
