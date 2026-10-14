import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataDisplayProvider } from "@/lib/data-display-provider";
import useDataDisplay from "@/hooks/use-data-display";
import DataDisplayToggle from "./DataDisplayToggle";

const key = "test:display-toggle";

function DisplayReader() {
  const { dataDisplay } = useDataDisplay();
  return <output>{dataDisplay}</output>;
}

afterEach(() => {
  localStorage.removeItem(key);
  vi.restoreAllMocks();
});

describe("DataDisplayToggle", () => {
  it("offers the next view, updates another consumer, and persists click and keyboard choices", async () => {
    const user = userEvent.setup();
    const view = render(<DataDisplayProvider storageKey={key}><form onSubmit={event => event.preventDefault()}><DataDisplayToggle /></form><DisplayReader /></DataDisplayProvider>);
    const gridAction = screen.getByRole("button", { name: "Alternar para visualização em grade" });
    expect(gridAction).toHaveAttribute("type", "button");
    expect(screen.getByText("table")).toBeVisible();
    await user.click(gridAction);
    expect(screen.getByText("grid")).toBeVisible();
    expect(localStorage.getItem(key)).toBe("grid");
    await user.keyboard("{Enter}");
    expect(screen.getByText("table")).toBeVisible();
    expect(localStorage.getItem(key)).toBe("table");
    await user.click(screen.getByRole("button", { name: "Alternar para visualização em grade" }));
    view.unmount();
    render(<DataDisplayProvider storageKey={key}><DataDisplayToggle /><DisplayReader /></DataDisplayProvider>);
    expect(screen.getByText("grid")).toBeVisible();
    expect(screen.getByRole("button", { name: "Alternar para visualização em tabela" })).toBeVisible();
  });
});
