import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createColumnHelper } from "@tanstack/react-table";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import DataTable, { type DataTableFeatures } from "@/components/DataTable";
import RowActions from "@/components/RowActions";

const products = [
  { id: 42, name: "Limpa Vidros" },
  { id: 7, name: "Detergente" },
];
const helper = createColumnHelper<DataTableFeatures, (typeof products)[number]>();

afterEach(cleanup);

describe("RowActions", () => {
  it("calls the selected action with the full record from its table row", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const columns = helper.columns([
      helper.accessor("name", { header: "Produto" }),
      helper.display({
        id: "actions",
        header: "Ações",
        cell: ({ row }) => (
          <RowActions
            item={row.original}
            itemLabel={row.original.name}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ),
      }),
    ]);
    render(
      <DataTable data={products} columns={columns} getRowId={(product) => String(product.id)} />,
    );

    await user.click(screen.getByRole("button", { name: "Editar Detergente" }));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith(products[1]);
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Excluir Limpa Vidros" }));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(products[0]);
  });

  it("supports keyboard activation without submitting a form or opening row details", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onDetails = vi.fn();
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <table>
          <tbody>
            <tr onClick={onDetails}>
              <td>
                <RowActions item={products[0]} onEdit={onEdit} onDelete={onDelete} />
              </td>
            </tr>
          </tbody>
        </table>
      </form>,
    );

    await user.tab();
    expect(screen.getByRole("button", { name: "Editar registro" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.tab();
    expect(screen.getByRole("button", { name: "Excluir registro" })).toHaveFocus();
    await user.keyboard(" ");

    expect(onEdit).toHaveBeenCalledExactlyOnceWith(products[0]);
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(products[0]);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onDetails).not.toHaveBeenCalled();
  });

  it("blocks both actions when disabled and enables them again when the operation finishes", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const { rerender } = render(
      <RowActions item={products[0]} onEdit={onEdit} onDelete={onDelete} disabled />,
    );

    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
      await user.click(button);
    }
    expect(onEdit).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();

    rerender(<RowActions item={products[0]} onEdit={onEdit} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: "Editar registro" }));
    expect(onEdit).toHaveBeenCalledExactlyOnceWith(products[0]);
  });

  it("only offers configured actions and renders nothing when none are available", () => {
    const { rerender } = render(
      <RowActions item={products[0]} onEdit={() => {}} itemLabel="Limpa Vidros" />,
    );

    const actions = screen.getByRole("group", { name: "Ações de Limpa Vidros" });
    expect(within(actions).getAllByRole("button")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Excluir/ })).not.toBeInTheDocument();

    rerender(<RowActions item={products[0]} onDelete={() => {}} />);
    expect(screen.getByRole("button", { name: "Excluir registro" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Editar/ })).not.toBeInTheDocument();

    rerender(<RowActions item={products[0]} />);
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });
});
