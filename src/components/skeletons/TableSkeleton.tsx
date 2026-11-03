import Skeleton from "../smoothui/skeleton-loader";
import { TableCell, TableRow } from "../ui/table";

const rows = [1, 2, 3, 4, 5, 6];

/** Loading rows to render inside an existing TableBody, preserving its headers. */
function TableSkeleton({ columnCount }: { columnCount: number }) {
  const columns = Array.from({ length: columnCount }, (_, index) => index + 1);

  return (
    <>
      <TableRow className="sr-only">
        <TableCell colSpan={columnCount}>
          <span role="status">Carregando dados...</span>
        </TableCell>
      </TableRow>
      {rows.map((row) => (
        <TableRow key={row} aria-hidden="true">
          {columns.map((column) => (
            <TableCell key={column} className="h-24">
              <Skeleton className="h-5 w-3/4 min-w-16 rounded-full motion-reduce:animate-none" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default TableSkeleton;
