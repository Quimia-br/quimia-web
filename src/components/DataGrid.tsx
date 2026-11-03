import { cn } from "cn";
import type { ComponentProps, Key, ReactNode } from "react";
import CardSkeleton from "./skeletons/CardSkeleton";

const skeletonItems = [1, 2, 3, 4, 5, 6];

export type DataGridProps<T> = Omit<ComponentProps<"ul">, "children" | "role" | "aria-busy"> & {
  data: readonly T[];
  getItemId: (item: T) => Key;
  renderItem: (item: T) => ReactNode;
  isLoading?: boolean;
  loadingMessage?: ReactNode;
  emptyMessage?: ReactNode;
};

function DataGrid<T>({
  data,
  getItemId,
  renderItem,
  isLoading = false,
  loadingMessage = "Carregando dados...",
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  ...props
}: DataGridProps<T>) {
  return (
    <ul
      {...props}
      role="list"
      aria-busy={isLoading}
      className={cn(
        "m-0 grid min-h-full min-w-0 w-full list-none grid-cols-[repeat(auto-fit,minmax(min(100%,20rem),1fr))] items-stretch gap-5 rounded-[60px] bg-surface-base p-4 sm:p-8",
        className,
      )}
    >
      {isLoading ? (
        <>
          <li role="none" className="sr-only">
            <span role="status">{loadingMessage}</span>
          </li>
          {skeletonItems.map((id) => (
            <li key={id} aria-hidden="true">
              <CardSkeleton />
            </li>
          ))}
        </>
      ) : data.length === 0 ? (
        <li
          role="none"
          className="col-span-full flex min-h-80 items-center justify-center text-center text-foreground"
        >
          <div role={typeof emptyMessage === "string" ? "status" : undefined}>{emptyMessage}</div>
        </li>
      ) : (
        data.map((item) => (
          <li key={getItemId(item)} className="min-w-0 [overflow-wrap:anywhere]">
            {renderItem(item)}
          </li>
        ))
      )}
    </ul>
  );
}

export default DataGrid;
