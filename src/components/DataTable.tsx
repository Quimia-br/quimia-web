import {
  FlexRender,
  tableFeatures,
  useTable,
  type RowData,
  type TableOptions,
} from "@tanstack/react-table";
import type { ComponentProps, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { cn } from "cn";
import TableSkeleton from "./skeletons/TableSkeleton";

const features = tableFeatures({});

export type DataTableFeatures = typeof features;

export type DataTableProps<TData extends RowData> = Pick<
  TableOptions<DataTableFeatures, TData>,
  "data" | "columns"
> &
  Omit<ComponentProps<typeof Table>, "children"> & {
    getRowId: NonNullable<TableOptions<DataTableFeatures, TData>["getRowId"]>;
    caption?: ReactNode;
    isLoading?: boolean;
    emptyMessage?: ReactNode;
  };

function DataTable<TData extends RowData>({
  data,
  columns,
  getRowId,
  caption,
  isLoading = false,
  emptyMessage = "Nenhum resultado encontrado.",
  className,
  ...props
}: DataTableProps<TData>) {
  const table = useTable({ features, data, columns, getRowId });
  const rows = table.getRowModel().rows;
  const columnCount = Math.max(table.getAllLeafColumns().length, 1);

  return (
    <Table
      className={cn(!isLoading && !rows.length && "h-full", className)}
      {...props}
      aria-busy={isLoading}
    >
      {caption != null && <TableCaption>{caption}</TableCaption>}
      <TableHeader className="h-px">
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => (
              <TableHead
                key={header.id}
                colSpan={header.colSpan}
                scope={header.subHeaders.length ? "colgroup" : "col"}
              >
                {!header.isPlaceholder && <FlexRender header={header} />}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableSkeleton columnCount={columnCount} />
        ) : rows.length ? (
          rows.map((row) => (
            <TableRow key={row.id}>
              {row.getAllCells().map((cell) => (
                <TableCell key={cell.id}>
                  <FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={columnCount} className="text-center align-middle whitespace-normal">
              <div className="flex min-h-80 items-center justify-center">{emptyMessage}</div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default DataTable;
