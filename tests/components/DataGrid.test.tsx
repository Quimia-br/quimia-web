import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import DataGrid from "@/components/DataGrid";

const people = [
  { id: 42, name: "Ana" },
  { id: 7, name: "Bruno" },
];
const getItemId = (person: (typeof people)[number]) => person.id;

afterEach(cleanup);

describe("DataGrid", () => {
  it("keeps interactive card state with its record after reordering", () => {
    function Counter({ name }: { name: string }) {
      const [count, setCount] = useState(0);
      return (
        <button onClick={() => setCount(count + 1)}>
          {name}: {count}
        </button>
      );
    }
    const renderItem = (person: (typeof people)[number]) => <Counter name={person.name} />;
    const { rerender } = render(
      <DataGrid data={people} getItemId={getItemId} renderItem={renderItem} aria-label="Pessoas" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Ana: 0" }));

    rerender(
      <DataGrid
        data={[people[1], people[0]]}
        getItemId={getItemId}
        renderItem={renderItem}
        aria-label="Pessoas"
      />,
    );

    expect(screen.getByRole("list", { name: "Pessoas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ana: 1" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Bruno");
  });

  it("replaces stale cards with loading and then the custom empty state", () => {
    const renderItem = (person: (typeof people)[number]) => person.name;
    const { rerender } = render(
      <DataGrid
        data={people}
        getItemId={getItemId}
        renderItem={renderItem}
        isLoading
        aria-label="Pessoas"
      />,
    );

    expect(screen.getByLabelText("Pessoas")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Carregando dados...");
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();

    rerender(
      <DataGrid
        data={[]}
        getItemId={getItemId}
        renderItem={renderItem}
        emptyMessage="Nenhuma pessoa."
        aria-label="Pessoas"
      />,
    );

    expect(screen.getByLabelText("Pessoas")).toHaveAttribute("aria-busy", "false");
    expect(screen.getByRole("status")).toHaveTextContent("Nenhuma pessoa.");
  });
});
