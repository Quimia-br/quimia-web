import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createColumnHelper } from "@tanstack/react-table";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import DataTable, { type DataTableFeatures } from "@/components/DataTable";

interface Person {
  id: number;
  name: string;
  age: number;
  company: { name: string };
}

const helper = createColumnHelper<DataTableFeatures, Person>();
const columns = helper.columns([
  helper.accessor("name", { header: "Nome" }),
  helper.accessor("age", { header: "Idade" }),
  helper.accessor("company.name", { header: "Empresa" }),
]);
const people: Person[] = [
  { id: 42, name: "Ana", age: 32, company: { name: "Quimia" } },
  { id: 7, name: "Bruno", age: 28, company: { name: "Acme" } },
];
const getRowId = (person: Person) => String(person.id);

afterEach(cleanup);

describe("DataTable", () => {
  it("places primitive and nested values under their configured headers", () => {
    render(<DataTable data={people} columns={columns} getRowId={getRowId} caption="Pessoas" />);

    expect(screen.getByRole("table", { name: "Pessoas" })).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(
      within(rows[0])
        .getAllByRole("columnheader")
        .map((cell) => cell.textContent),
    ).toEqual(["Nome", "Idade", "Empresa"]);
    expect(
      within(rows[1])
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Ana", "32", "Quimia"]);
    expect(
      within(rows[2])
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["Bruno", "28", "Acme"]);
  });

  it("keeps custom cell state attached to the record when rows reorder", () => {
    function Counter({ name }: { name: string }) {
      const [count, setCount] = useState(0);
      return (
        <button onClick={() => setCount(count + 1)}>
          {name}: {count}
        </button>
      );
    }
    const customColumns = helper.columns([
      helper.accessor("name", {
        header: "Pessoa",
        cell: ({ row }) => <Counter name={row.original.name} />,
      }),
    ]);
    const { rerender } = render(
      <DataTable data={people} columns={customColumns} getRowId={getRowId} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ana: 0" }));

    rerender(
      <DataTable data={[people[1], people[0]]} columns={customColumns} getRowId={getRowId} />,
    );

    expect(screen.getByRole("button", { name: "Ana: 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bruno: 0" })).toBeInTheDocument();
  });

  it("renders every row supplied by the server without slicing the page again", () => {
    const page = Array.from({ length: 15 }, (_, index) => ({ ...people[0], id: index }));
    render(<DataTable data={page} columns={columns} getRowId={getRowId} />);

    expect(screen.getAllByRole("row")).toHaveLength(16);
  });

  it("shows an empty message spanning leaf columns, including grouped headers", () => {
    const groupedColumns = helper.columns([
      helper.group({ header: "Pessoa", columns: helper.columns([columns[0], columns[1]]) }),
    ]);
    render(
      <DataTable
        data={[]}
        columns={groupedColumns}
        getRowId={getRowId}
        emptyMessage="Nenhuma pessoa encontrada."
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Pessoa" })).toHaveAttribute("colspan", "2");
    expect(screen.getByRole("columnheader", { name: "Pessoa" })).toHaveAttribute(
      "scope",
      "colgroup",
    );
    expect(screen.getByRole("cell", { name: "Nenhuma pessoa encontrada." })).toHaveAttribute(
      "colspan",
      "2",
    );
  });

  it("announces loading before showing the empty state or supplied rows", () => {
    const { rerender } = render(
      <DataTable
        data={people}
        columns={columns}
        getRowId={getRowId}
        isLoading
        aria-label="Pessoas"
      />,
    );

    expect(screen.getByRole("table", { name: "Pessoas" })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();

    rerender(<DataTable data={[]} columns={columns} getRowId={getRowId} aria-label="Pessoas" />);

    expect(screen.getByRole("table", { name: "Pessoas" })).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Nenhum resultado encontrado." })).toBeInTheDocument();
  });

  it("updates cells when the data for an existing record changes", () => {
    const { rerender } = render(<DataTable data={people} columns={columns} getRowId={getRowId} />);

    rerender(
      <DataTable
        data={[{ ...people[0], name: "Ana Maria" }]}
        columns={columns}
        getRowId={getRowId}
      />,
    );

    expect(screen.getByRole("cell", { name: "Ana Maria" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Bruno" })).not.toBeInTheDocument();
  });
});
